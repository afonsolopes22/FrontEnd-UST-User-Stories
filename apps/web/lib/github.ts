import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import { getRequiredEnv } from "./env";

export async function getInstallationRepos() {
  const privateKey = Buffer.from(
    getRequiredEnv("GITHUB_APP_PRIVATE_KEY"),
    "base64"
  ).toString("utf-8");

  const auth = createAppAuth({
    appId: getRequiredEnv("GITHUB_APP_ID"),
    privateKey,
    installationId: getRequiredEnv("GITHUB_APP_INSTALLATION_ID"),
  });

  const { token } = await auth({ type: "installation" });

  const octokit = new Octokit({ auth: token });

  const { data } = await octokit.apps.listReposAccessibleToInstallation({
    per_page: 100,
  });

  return data.repositories.map((repo) => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    private: repo.private,
    url: repo.html_url,
    description: repo.description,
  }));
}