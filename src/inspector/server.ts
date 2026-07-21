/* R-Think Runtime
 * Copyright (C) 2026 Hendri RH
 * SPDX-License-Identifier: AGPL-3.0-only */

// R-Think Runtime — Inspector HTTP Server Adapter
// Mission: RTHINK-RT-008C (Inspector Frontend)
//
// Thin read-only HTTP transport over InspectorReadModel.
// Maps 26 GET + 1 SSE endpoints to HTTP routes.
// ZERO runtime mutation routes. ZERO business logic.
//
// Architecture: Runtime → InspectorReadModel → This Server → HTTP → Frontend

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { InspectorReadModel } from "./inspector-read-model.js";
import type { InspectorCompositionInput } from "./composition-root.js";
import { createInspector } from "./composition-root.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── JSON Response Helpers ──────────────────────────────────────────────────

function jsonResponse(
  res: http.ServerResponse,
  status: number,
  data: unknown
): void {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
}

function handleError(res: http.ServerResponse, err: unknown): void {
  const message = err instanceof Error ? err.message : "Unknown error";
  jsonResponse(res, 500, { error: message });
}

function parseQuery(url: string): URL {
  return new URL(url, "http://localhost");
}

// ─── Route Handler ──────────────────────────────────────────────────────────

function handleRequest(
  inspector: InspectorReadModel,
  req: http.IncomingMessage,
  res: http.ServerResponse
): void {
  const url = parseQuery(req.url ?? "/");
  const pathname = url.pathname;
  const params = Object.fromEntries(url.searchParams);

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  try {
    // ─── Mission Endpoints (10 GET) ──────────────────────────────────────
    if (pathname === "/api/missions" && req.method === "GET") {
      const filters = params["state"]
        ? { state: params["state"] }
        : undefined;
      const pagination = {
        page: params["page"] ? Number(params["page"]) : undefined,
        pageSize: params["pageSize"] ? Number(params["pageSize"]) : undefined,
      };
      return jsonResponse(res, 200, inspector.listMissions(filters, pagination));
    }

    const missionMatch = pathname.match(/^\/api\/missions\/([^/]+)$/);
    if (missionMatch && req.method === "GET") {
      const missionId = missionMatch[1]!;
      return jsonResponse(res, 200, inspector.getMission(missionId));
    }

    const missionStateMatch = pathname.match(
      /^\/api\/missions\/([^/]+)\/state$/
    );
    if (missionStateMatch && req.method === "GET") {
      return jsonResponse(
        res,
        200,
        inspector.getMissionState(missionStateMatch[1]!)
      );
    }

    const missionHistoryMatch = pathname.match(
      /^\/api\/missions\/([^/]+)\/history$/
    );
    if (missionHistoryMatch && req.method === "GET") {
      return jsonResponse(
        res,
        200,
        inspector.getMissionHistory(missionHistoryMatch[1]!)
      );
    }

    const missionEventsMatch = pathname.match(
      /^\/api\/missions\/([^/]+)\/events$/
    );
    if (missionEventsMatch && req.method === "GET") {
      const pagination = {
        page: params["page"] ? Number(params["page"]) : undefined,
        pageSize: params["pageSize"] ? Number(params["pageSize"]) : undefined,
      };
      return jsonResponse(
        res,
        200,
        inspector.getMissionEvents(missionEventsMatch[1]!, pagination)
      );
    }

    const missionArtifactsMatch = pathname.match(
      /^\/api\/missions\/([^/]+)\/artifacts$/
    );
    if (missionArtifactsMatch && req.method === "GET") {
      const pagination = {
        page: params["page"] ? Number(params["page"]) : undefined,
        pageSize: params["pageSize"] ? Number(params["pageSize"]) : undefined,
      };
      return jsonResponse(
        res,
        200,
        inspector.getMissionArtifacts(missionArtifactsMatch[1]!, pagination)
      );
    }

    const missionEvidenceMatch = pathname.match(
      /^\/api\/missions\/([^/]+)\/evidence$/
    );
    if (missionEvidenceMatch && req.method === "GET") {
      return jsonResponse(
        res,
        200,
        inspector.getMissionEvidence(missionEvidenceMatch[1]!)
      );
    }

    const missionAuthorityMatch = pathname.match(
      /^\/api\/missions\/([^/]+)\/authority$/
    );
    if (missionAuthorityMatch && req.method === "GET") {
      return jsonResponse(
        res,
        200,
        inspector.getMissionAuthority(missionAuthorityMatch[1]!)
      );
    }

    const missionContradictionsMatch = pathname.match(
      /^\/api\/missions\/([^/]+)\/contradictions$/
    );
    if (missionContradictionsMatch && req.method === "GET") {
      return jsonResponse(
        res,
        200,
        inspector.getMissionContradictions(missionContradictionsMatch[1]!)
      );
    }

    const missionReplayMatch = pathname.match(
      /^\/api\/missions\/([^/]+)\/replay$/
    );
    if (missionReplayMatch && req.method === "GET") {
      return jsonResponse(
        res,
        200,
        inspector.replayMission(missionReplayMatch[1]!)
      );
    }

    // ─── Event Endpoints (2 GET) ─────────────────────────────────────────
    if (pathname === "/api/events" && req.method === "GET") {
      const filters: Record<string, string> = {};
      if (params["missionId"]) filters["missionId"] = params["missionId"]!;
      if (params["eventType"]) filters["eventType"] = params["eventType"]!;
      const pagination = {
        page: params["page"] ? Number(params["page"]) : undefined,
        pageSize: params["pageSize"] ? Number(params["pageSize"]) : undefined,
      };
      return jsonResponse(
        res,
        200,
        inspector.listEvents(
          Object.keys(filters).length > 0
            ? (filters as Parameters<typeof inspector.listEvents>[0])
            : undefined,
          pagination
        )
      );
    }

    const eventMatch = pathname.match(/^\/api\/events\/([^/]+)$/);
    if (eventMatch && req.method === "GET") {
      return jsonResponse(res, 200, inspector.getEvent(eventMatch[1]!));
    }

    // ─── Artifact Endpoints (3 GET) ──────────────────────────────────────
    if (pathname === "/api/artifacts" && req.method === "GET") {
      const filters: Record<string, string> = {};
      if (params["missionId"]) filters["missionId"] = params["missionId"]!;
      if (params["artifactType"]) filters["artifactType"] = params["artifactType"]!;
      return jsonResponse(
        res,
        200,
        inspector.listArtifacts(
          Object.keys(filters).length > 0
            ? (filters as Parameters<typeof inspector.listArtifacts>[0])
            : undefined
        )
      );
    }

    const artifactMatch = pathname.match(/^\/api\/artifacts\/([^/]+)$/);
    if (artifactMatch && req.method === "GET") {
      return jsonResponse(res, 200, inspector.getArtifact(artifactMatch[1]!));
    }

    const artifactHistoryMatch = pathname.match(
      /^\/api\/artifacts\/([^/]+)\/history$/
    );
    if (artifactHistoryMatch && req.method === "GET") {
      return jsonResponse(
        res,
        200,
        inspector.getArtifactHistory(artifactHistoryMatch[1]!)
      );
    }

    // ─── Evidence Endpoints (4 GET) ──────────────────────────────────────
    if (pathname === "/api/evidence/graph" && req.method === "GET") {
      return jsonResponse(res, 200, inspector.getEvidenceGraph());
    }
    if (pathname === "/api/evidence/nodes" && req.method === "GET") {
      const graph = inspector.getEvidenceGraph();
      return jsonResponse(res, 200, {
        nodes: graph.nodes,
        nodeCount: graph.nodeCount,
      });
    }
    if (pathname === "/api/evidence/edges" && req.method === "GET") {
      const graph = inspector.getEvidenceGraph();
      return jsonResponse(res, 200, {
        edges: graph.edges,
        edgeCount: graph.edgeCount,
      });
    }
    if (pathname === "/api/evidence/validate" && req.method === "GET") {
      return jsonResponse(res, 200, inspector.validateEvidenceGraph());
    }

    // ─── Router Endpoints (3 GET) ────────────────────────────────────────
    if (pathname === "/api/router/methods" && req.method === "GET") {
      return jsonResponse(res, 200, inspector.listMethods());
    }
    if (pathname === "/api/router/providers" && req.method === "GET") {
      return jsonResponse(res, 200, inspector.listProviders());
    }
    if (pathname === "/api/router/capabilities" && req.method === "GET") {
      return jsonResponse(res, 200, inspector.listCapabilities());
    }

    // ─── Health Endpoint (1 GET) ─────────────────────────────────────────
    if (pathname === "/api/health" && req.method === "GET") {
      return jsonResponse(res, 200, inspector.getHealth());
    }

    // ─── Statistics Endpoint (1 GET) ─────────────────────────────────────
    if (pathname === "/api/stats" && req.method === "GET") {
      return jsonResponse(res, 200, inspector.getStatistics());
    }

    // ─── Snapshot Endpoints (2 GET) ──────────────────────────────────────
    if (pathname === "/api/snapshots" && req.method === "GET") {
      const aggregateId = params["aggregateId"];
      return jsonResponse(
        res,
        200,
        inspector.listSnapshots(aggregateId)
      );
    }

    const snapshotMatch = pathname.match(/^\/api\/snapshots\/([^/]+)$/);
    if (snapshotMatch && req.method === "GET") {
      return jsonResponse(
        res,
        200,
        inspector.getSnapshot(snapshotMatch[1]!)
      );
    }

    // ─── SSE Endpoint (1 SSE) ────────────────────────────────────────────
    if (pathname === "/api/stream" && req.method === "GET") {
      const since = Number(params["since"] ?? "0");
      return jsonResponse(res, 200, inspector.getEventsSince(since));
    }

    // ─── 404 ─────────────────────────────────────────────────────────────
    jsonResponse(res, 404, { error: "Not found", pathname });
  } catch (err) {
    handleError(res, err);
  }
}

// ─── Static File Serving ────────────────────────────────────────────────────

function serveStatic(
  distPath: string,
  req: http.IncomingMessage,
  res: http.ServerResponse
): boolean {
  const url = req.url ?? "/";
  let filePath = path.join(distPath, url === "/" ? "index.html" : url);

  // SPA fallback: if file doesn't exist, serve index.html
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distPath, "index.html");
  }

  if (!fs.existsSync(filePath)) {
    return false;
  }

  const ext = path.extname(filePath);
  const contentTypes: Record<string, string> = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
  };

  const contentType = contentTypes[ext] ?? "application/octet-stream";
  const content = fs.readFileSync(filePath);

  res.writeHead(200, { "Content-Type": contentType });
  res.end(content);
  return true;
}

// ─── Server Creation ────────────────────────────────────────────────────────

export interface InspectorServerOptions {
  port?: number;
  inspector: InspectorReadModel;
  distPath?: string;
}

export function createInspectorServer(
  options: InspectorServerOptions
): http.Server {
  const { port = 3001, inspector, distPath } = options;

  const server = http.createServer((req, res) => {
    // API routes first
    if (req.url?.startsWith("/api/")) {
      return handleRequest(inspector, req, res);
    }
    // Static files (frontend build)
    if (distPath && !serveStatic(distPath, req, res)) {
      jsonResponse(res, 404, { error: "Not found" });
    }
  });

  return server;
}

// ─── Start Function (for direct execution) ─────────────────────────────────

export async function startInspectorServer(
  input: InspectorCompositionInput,
  port = 3001
): Promise<http.Server> {
  const inspector = createInspector(input);

  // Look for frontend dist
  const distPath = path.resolve(__dirname, "../../inspector-ui/dist");

  const server = createInspectorServer({
    port,
    inspector,
    distPath: fs.existsSync(distPath) ? distPath : undefined,
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`Inspector Server running at http://localhost:${port}`);
      if (fs.existsSync(distPath)) {
        console.log(`Frontend served from ${distPath}`);
      }
      resolve(server);
    });
  });
}
