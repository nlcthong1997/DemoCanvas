using Microsoft.PowerPlatform.Dataverse.Client;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Metadata;
using Microsoft.Xrm.Sdk.Messages;
using Microsoft.Xrm.Sdk.Query;
using Microsoft.Crm.Sdk.Messages;
using Microsoft.Identity.Client;

const string orgUrl = "https://org6856e656.crm5.dynamics.com";
const string solution = "XCL_canvas_pcf_lab";
const string table = "xcl_pcfprobefile";
var deviceLogin = args.Contains("--device-login");
args = args.Where(arg=>arg != "--device-login").ToArray();
ServiceClient CreateClient() {
  if (!deviceLogin) return new ServiceClient($"AuthType=OAuth;Url={orgUrl};Username=ryan.dev@ducthinh120199gmail.onmicrosoft.com;AppId=51f81489-12ee-4a9e-aaae-a2591f45987d;RedirectUri=http://localhost;LoginPrompt=Auto;RequireNewInstance=true");
  var application = PublicClientApplicationBuilder.Create("51f81489-12ee-4a9e-aaae-a2591f45987d").WithAuthority("https://login.microsoftonline.com/organizations").Build();
  AuthenticationResult? authentication = null;
  return new ServiceClient(new Uri(orgUrl), async _ => {
    if (authentication == null || authentication.ExpiresOn < DateTimeOffset.UtcNow.AddMinutes(2)) {
      authentication = await application.AcquireTokenWithDeviceCode(new[] {$"{orgUrl}/.default"}, code => {Console.WriteLine(code.Message);return Task.CompletedTask;}).ExecuteAsync();
    }
    return authentication.AccessToken;
  }, true);
}
using var client = CreateClient();
if (!client.IsReady) throw new InvalidOperationException(client.LastError);
if (client.ConnectedOrgUriActual.Host != new Uri(orgUrl).Host) throw new InvalidOperationException("Unexpected organization.");
var who = (WhoAmIResponse)client.Execute(new WhoAmIRequest());
if (who.OrganizationId != Guid.Parse("e2466759-d1c2-f111-a04f-002248ed6f86")) throw new InvalidOperationException("Organization ID does not match demo target.");
Console.WriteLine($"Verified demo organization {who.OrganizationId}");
var solutions = client.RetrieveMultiple(new QueryExpression("solution") { ColumnSet = new ColumnSet("solutionid"), Criteria = new FilterExpression { Conditions = { new ConditionExpression("uniquename", ConditionOperator.Equal, solution) } } });
if (solutions.Entities.Count != 1 || solutions.Entities[0].Id != Guid.Parse("587e1496-3ec5-f111-a05a-002248ec830f")) throw new InvalidOperationException("Target solution mismatch.");
if (args.Length == 1 && args[0] == "--inspect") {
  foreach (var logicalName in new[] { table, "account" }) {
    var definition = ((RetrieveEntityResponse)client.Execute(new RetrieveEntityRequest { LogicalName=logicalName, EntityFilters=EntityFilters.Entity | EntityFilters.Attributes, RetrieveAsIfPublished=false })).EntityMetadata;
    Console.WriteLine(System.Text.Json.JsonSerializer.Serialize(new {
      definition.LogicalName, definition.SchemaName, definition.EntitySetName, definition.LogicalCollectionName,
      definition.PrimaryIdAttribute, definition.PrimaryNameAttribute, definition.ObjectTypeCode,
      definition.IsValidForAdvancedFind, definition.IsCustomEntity, definition.IsPrivate,
      definition.DataProviderId, definition.OwnershipType, definition.IsManaged,
      columns=definition.Attributes.Select(a=>new {a.LogicalName,a.AttributeType,a.IsValidForRead,a.IsValidForCreate,a.IsValidForUpdate,a.AttributeOf,a.IsPrimaryId,a.IsPrimaryName,DisplayName=a.DisplayName?.LocalizedLabels.FirstOrDefault()?.Label})
    }));
    var views = client.RetrieveMultiple(new QueryExpression("savedquery") {ColumnSet=new ColumnSet("name","querytype","isdefault"),Criteria=new FilterExpression {Conditions={new ConditionExpression("returnedtypecode",ConditionOperator.Equal,definition.ObjectTypeCode!.Value)}}});
    foreach(var view in views.Entities) Console.WriteLine($"VIEW {logicalName}: {view.GetAttributeValue<string>("name")} type {view.GetAttributeValue<int>("querytype")} default {view.GetAttributeValue<bool>("isdefault")}");
  }
  return;
}
if (args.Length > 0 && args[0] == "--verify") {
  if (args.Length != 3) throw new ArgumentException("Usage: --verify <batch-id> <original-file-directory>");
  var query = new QueryExpression(table) {
    ColumnSet = new ColumnSet("xcl_filename", "xcl_contentbase64", "xcl_batchid"),
    Criteria = new FilterExpression { Conditions = { new ConditionExpression("xcl_batchid", ConditionOperator.Equal, args[1]) } }
  };
  var records = client.RetrieveMultiple(query).Entities;
  if (records.Count == 0) throw new InvalidOperationException("No records found for this batch.");
  var originalDirectory = Path.GetFullPath(args[2]);
  var names = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
  foreach (var record in records) {
    var name = record.GetAttributeValue<string>("xcl_filename");
    if (string.IsNullOrEmpty(name) || name != Path.GetFileName(name) || !names.Add(name)) throw new InvalidOperationException("Missing, unsafe or duplicate file name in batch.");
    var stored = Convert.FromBase64String(record.GetAttributeValue<string>("xcl_contentbase64") ?? throw new InvalidOperationException("Missing file contents."));
    var original = File.ReadAllBytes(Path.Combine(originalDirectory, name));
    if (!stored.SequenceEqual(original)) throw new InvalidOperationException($"File bytes do not match: {name}");
    Console.WriteLine($"Verified {name}: record {record.Id}, {stored.Length} bytes, SHA256 {Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(stored))}");
  }
  Console.WriteLine($"Verified {records.Count} actual Dataverse file records against originals. No writes performed.");
  return;
}
if (args.Length != 0) throw new ArgumentException("Use no arguments for table setup, or --verify <batch-id> <original-file-directory> for read-only verification.");
EntityMetadata? metadata = null;
var definitions = (RetrieveAllEntitiesResponse)client.Execute(new RetrieveAllEntitiesRequest {EntityFilters=EntityFilters.Entity});
if (definitions.EntityMetadata.Any(entity=>entity.LogicalName==table)) metadata = ((RetrieveEntityResponse)client.Execute(new RetrieveEntityRequest {LogicalName=table,EntityFilters=EntityFilters.Attributes})).EntityMetadata;
if (metadata == null) {
  client.Execute(new CreateEntityRequest {
    SolutionUniqueName=solution,
    Entity=new EntityMetadata {SchemaName="xcl_PcfProbeFile",DisplayName=new Label("PCF Probe File",1033),DisplayCollectionName=new Label("PCF Probe Files",1033),Description=new Label("Dedicated PCF integration test data. Small processed files are stored as Base64 text for this prototype.",1033),OwnershipType=OwnershipTypes.UserOwned,IsActivity=false,HasNotes=false,HasActivities=false},
    PrimaryAttribute=new StringAttributeMetadata {SchemaName="xcl_Name",DisplayName=new Label("Name",1033),MaxLength=200,RequiredLevel=new AttributeRequiredLevelManagedProperty(AttributeRequiredLevel.ApplicationRequired),FormatName=StringFormatName.Text}
  });
  Console.WriteLine("Created dedicated PCF Probe Files table.");
  metadata = ((RetrieveEntityResponse)client.Execute(new RetrieveEntityRequest {LogicalName=table,EntityFilters=EntityFilters.Attributes})).EntityMetadata;
}
foreach (var spec in new[] { ("xcl_BatchId","Batch ID",100), ("xcl_FileName","File Name",260), ("xcl_MimeType","MIME Type",100), ("xcl_StudentId","Student ID",100) }) {
  if (metadata.Attributes.Any(attribute=>attribute.LogicalName==spec.Item1.ToLowerInvariant())) continue;
  client.Execute(new CreateAttributeRequest {EntityName=table,SolutionUniqueName=solution,Attribute=new StringAttributeMetadata {SchemaName=spec.Item1,DisplayName=new Label(spec.Item2,1033),MaxLength=spec.Item3,RequiredLevel=new AttributeRequiredLevelManagedProperty(AttributeRequiredLevel.None),FormatName=StringFormatName.Text}});
}
if (!metadata.Attributes.Any(attribute=>attribute.LogicalName=="xcl_contentbase64")) client.Execute(new CreateAttributeRequest {EntityName=table,SolutionUniqueName=solution,Attribute=new MemoAttributeMetadata {SchemaName="xcl_ContentBase64",DisplayName=new Label("Content Base64",1033),MaxLength=1048576,Format=StringFormat.Text,RequiredLevel=new AttributeRequiredLevelManagedProperty(AttributeRequiredLevel.None)}});
client.Execute(new PublishXmlRequest {ParameterXml=$"<importexportxml><entities><entity>{table}</entity></entities></importexportxml>"});
Console.WriteLine("Published dedicated table and probe columns. No file content has been uploaded by this setup tool.");
var finalMetadata = ((RetrieveEntityResponse)client.Execute(new RetrieveEntityRequest {LogicalName=table,EntityFilters=EntityFilters.Attributes})).EntityMetadata;
var schema = new {logicalName=table, primaryId=finalMetadata.PrimaryIdAttribute, columns=finalMetadata.Attributes.Where(attribute=>attribute.LogicalName.StartsWith("xcl_")).Select(attribute=>new {logicalName=attribute.LogicalName, displayName=attribute.DisplayName?.LocalizedLabels.FirstOrDefault()?.Label, type=attribute.AttributeType.ToString()})};
Console.WriteLine("SCHEMA " + System.Text.Json.JsonSerializer.Serialize(schema));
