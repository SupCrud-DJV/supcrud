const { Pool } = require("pg");
const pool = new Pool(); // Configuración en db.config.js

async function requireAddon(addonCode) {
    return async (req, res, next) => {
        const workspaceId = req.workspace.id;
        const result = await pool.query(
            "SELECT active FROM workspace_addons wa JOIN addons a ON wa.addon_id = a.id WHERE wa.workspace_id = $1 AND a.code = $2",
            [workspaceId, addonCode]
        );
        if (!result.rows[0] || !result.rows[0].active) {
            return res.status(403).json({ message: "Add-on no activo" });
        }
        next();
    };
}

module.exports = requireAddon;