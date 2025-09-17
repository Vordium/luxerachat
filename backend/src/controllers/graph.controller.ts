import { Request, Response } from "express";
import { getSimilarByZpid, explainPath, getNeighborhoodStats } from "../graph/graph.service";
import { isNeo4jEnabled } from "../graph/neo4j.client";

export async function similarByZpid(req: Request, res: Response) {
  try {
    if (!isNeo4jEnabled()) return res.status(503).json({ error: "Neo4j is not configured" });
    const zpid = Number(req.params.zpid);
    if (!Number.isFinite(zpid)) return res.status(400).json({ error: "Invalid zpid" });
    const limit = Math.min(Number(req.query.limit ?? 10), 50);
    const results = await getSimilarByZpid(zpid, limit);
    return res.json({ zpid, results });
  } catch (err) {
    console.error("/graph/similar error", err);
    return res.status(500).json({ error: "Failed to retrieve graph recommendations" });
  }
}

export async function explainPropertyPath(req: Request, res: Response) {
  try {
    if (!isNeo4jEnabled()) return res.status(503).json({ error: "Neo4j is not configured" });
    const from = Number(req.query.from);
    const to = Number(req.query.to);
    if (!Number.isFinite(from) || !Number.isFinite(to)) {
      return res.status(400).json({ error: "from and to must be valid zpids" });
    }
    const data = await explainPath(from, to);
    if (!data) return res.status(404).json({ error: "No path found" });
    return res.json(data);
  } catch (err) {
    console.error("/graph/explain error", err);
    return res.status(500).json({ error: "Failed to explain path" });
  }
}

export async function neighborhoodStats(req: Request, res: Response) {
  try {
    if (!isNeo4jEnabled()) return res.status(503).json({ error: "Neo4j is not configured" });
    const name = String(req.params.name || "").trim();
    if (!name) return res.status(400).json({ error: "Missing neighborhood name" });
    const limit = Math.min(Number(req.query.limit ?? 50), 200);
    const data = await getNeighborhoodStats(name, limit);
    return res.json({ neighborhood: name, ...data });
  } catch (err) {
    console.error("/graph/neighborhood error", err);
    return res.status(500).json({ error: "Failed to retrieve neighborhood stats" });
  }
}

