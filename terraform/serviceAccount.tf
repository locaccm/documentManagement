module "service_account_documentManagmenet" {
  source       = "./modules/service_account"
  account_id   = "documentmanagement-service"
  display_name = "Document Management Service Account"
  project_id   = "intricate-pad-455413-f7"
  roles        = [
    "roles/cloudsql.client",
    "roles/storage.objectViewer"
  ]
}