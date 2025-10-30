resource "google_cloudbuild_trigger" "widget" {
  project  = var.project_id
  name     = var.trigger_name
  location = "us-central1"
  
  repository_event_config {
    repository = "projects/${var.project_id}/locations/us-central1/connections/swapkit/repositories/swapkit-SwapKit"
    push {
      branch = "^${var.branch_name}$"
    }
  }
  
  git_file_source {
    path       = "devops/cloudbuild/buildchangedapps.yaml"
    repository = "projects/${var.project_id}/locations/us-central1/connections/swapkit/repositories/swapkit-SwapKit"
    revision   = var.branch_ref
    repo_type  = "GITHUB"
  }

  service_account = "projects/${var.project_id}/serviceAccounts/cloudbuild@${var.project_id}.iam.gserviceaccount.com"
}

resource "google_artifact_registry_repository" "docker_repo" {
  location      = var.region_artifact
  project       = var.project_id
  repository_id = var.repository_name
  description   = "Docker repository for widget"
  format        = "DOCKER"
}