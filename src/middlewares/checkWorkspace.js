import Workspace from "../models/sql/Workspace.js";
import User from "../models/sql/User.js";

export default async function checkWorkspace(req, res, next) {
  const workspaceId =
    req.header("x-workspace-id") ||
    req.query.workspaceId ||
    req.body.workspaceId ||
    req.params?.workspaceId ||
    (req.baseUrl && req.baseUrl.startsWith('/api/workspaces') ? req.params?.id : undefined);
  const workspaceKey =
    req.header("x-workspace-key") || req.query.workspaceKey || req.body.workspaceKey;

  let workspace = null;
  if (workspaceId) {
    workspace = await Workspace.findById(workspaceId);
  } else if (workspaceKey) {
    workspace = await Workspace.findByKey(workspaceKey);
  }

  if (!workspace) {
    return res.status(404).json({ message: "Workspace not found" });
  }

  if (workspace.status !== "ACTIVE") {
    return res.status(403).json({ message: "Workspace is not active" });
  }

  const role = await User.getRoleInWorkspace(req.user.id, workspace.id);
  if (!role) {
    return res.status(403).json({ message: "You are not part of this workspace" });
  }

  req.workspace = workspace;
  req.workspaceRole = role;
  next();
}
