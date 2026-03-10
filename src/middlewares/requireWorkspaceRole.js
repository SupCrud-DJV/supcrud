export default function requireWorkspaceRole(...allowedRoles) {
  return (req, res, next) => {
    const role = req.workspaceRole;
    if (!role) {
      return res.status(403).json({ message: 'Workspace role not found' });
    }

    const allowed = Array.isArray(allowedRoles[0]) ? allowedRoles[0] : allowedRoles;
    if (!allowed.includes(role)) {
      return res.status(403).json({ message: 'Insufficient workspace role' });
    }

    next();
  };
}
