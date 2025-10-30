resource "google_cloudbuild_trigger" "deploy-service-on-image" {
  project  = var.project_id
  name     = "deploy-widget"
  location = "us-central1"
  
  pubsub_config {
    topic = "projects/swapkit-devops/topics/gcr"
  }

  source_to_build {
    ref        = var.branch_ref
    repository = "projects/${var.project_id}/locations/us-central1/connections/swapkit-org/repositories/swapkit-SwapKit"
    repo_type  = "GITHUB"
  }

  git_file_source {
    path       = "devops/cloudbuild/deploy.yaml"
    repository = "projects/${var.project_id}/locations/us-central1/connections/swapkit-org/repositories/swapkit-SwapKit"
    revision   = var.branch_ref
    repo_type  = "GITHUB"
  }

  service_account = "projects/${var.project_id}/serviceAccounts/cloudbuild@${var.project_id}.iam.gserviceaccount.com"

  filter = "_ACTION.matches(\"INSERT\") && _TAG.matches(\"us-docker.pkg.dev/swapkit-devops/widget.*:(dev|dev-deploy|feat)$\") && !_TAG.matches(\".*cache.*\")"

  substitutions = {
    _ACTION         = "$(body.message.data.action)"
    _DIGEST         = "$(body.message.data.digest)"
    _IMAGE_TAG      = "$${_TAG##*/}"
    _SERVICE_NAME   = "$${_SERVICE_PREFIX##*/}"
    _SERVICE_PREFIX = "$${_TAG%:*}"
    _TAG            = "$(body.message.data.tag)"
  }
}