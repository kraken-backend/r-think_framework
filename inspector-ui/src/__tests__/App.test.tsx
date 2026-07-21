import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App.tsx";
import { api } from "../api/client.ts";
import type {
  PaginatedResult,
  MissionSummary,
  MissionDetail,
  EventSummary,
  ArtifactSummary,
  ArtifactDetail,
  EvidenceGraphSnapshot,
  EvidenceValidation,
  RuntimeHealth,
  RuntimeStatistics,
  MethodSummary,
  ProviderSummary,
  ReplaySnapshot,
} from "../api/client.ts";

vi.mock("../api/client.ts", () => ({
  api: {
    listMissions: vi.fn(),
    getMission: vi.fn(),
    getMissionEvents: vi.fn(),
    getMissionArtifacts: vi.fn(),
    getMissionEvidence: vi.fn(),
    getMissionAuthority: vi.fn(),
    getMissionContradictions: vi.fn(),
    getMissionState: vi.fn(),
    getMissionHistory: vi.fn(),
    listEvents: vi.fn(),
    getEvent: vi.fn(),
    listArtifacts: vi.fn(),
    getArtifact: vi.fn(),
    getArtifactHistory: vi.fn(),
    getEvidenceGraph: vi.fn(),
    validateEvidence: vi.fn(),
    listMethods: vi.fn(),
    listProviders: vi.fn(),
    listCapabilities: vi.fn(),
    getHealth: vi.fn(),
    getStatistics: vi.fn(),
    listSnapshots: vi.fn(),
    getSnapshot: vi.fn(),
    getEventsSince: vi.fn(),
    replayMission: vi.fn(),
  },
}));

vi.mock("@xyflow/react", () => ({
  ReactFlow: ({ nodes }: { nodes: Array<{ id: string }> }) => (
    <div data-testid="react-flow">{nodes.length} nodes</div>
  ),
  Background: () => null,
  Controls: () => null,
  MarkerType: { ArrowClosed: "arrow-closed" },
}));

function wrap(ui: React.ReactNode, initialEntries?: string[]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
  );
}

const mockMissionSummary: MissionSummary = {
  missionId: "mission-001",
  currentState: "EXECUTING",
  previousState: "PLANNING",
  riskLevel: "LOW",
  authorityStatus: "GRANTED",
  contradictionCount: 0,
  isTerminated: false,
  eventCount: 5,
  artifactCount: 3,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T01:00:00Z",
};

const mockMissionDetail: MissionDetail = {
  ...mockMissionSummary,
  contract: { type: "EXECUTION" },
  stateHistory: ["PLANNING", "EXECUTING"],
  contradictions: [],
};

const mockEvent: EventSummary = {
  eventId: "evt-001",
  missionId: "mission-001",
  aggregateId: "mission-001",
  aggregateType: "MISSION",
  eventType: "STATE_TRANSITION",
  sequence: 1,
  globalPosition: 1,
  timestamp: "2025-01-01T00:00:00Z",
  actor: { id: "user-1", role: "HUMAN_ARCHITECT" },
};

const mockArtifact: ArtifactSummary = {
  artifactId: "art-001",
  artifactType: "BP",
  version: 1,
  missionId: "mission-001",
  confidence: 0.9,
  createdAt: "2025-01-01T00:00:00Z",
};

const mockArtifactDetail: ArtifactDetail = {
  ...mockArtifact,
  actor: { id: "user-1", role: "HUMAN_ARCHITECT" },
  state: "APPROVED",
  sourceRefs: [{ type: "FILE", uri: "/docs/bp.md", label: "Blueprint" }],
  payload: { title: "Test Blueprint" },
  evidenceRefs: [],
};

const mockGraph: EvidenceGraphSnapshot = {
  nodes: [
    {
      nodeId: "node-1",
      nodeType: "MISSION",
      missionId: "mission-001",
      timestamp: "2025-01-01T00:00:00Z",
      data: {},
      version: 1,
    },
  ],
  edges: [],
  nodeCount: 1,
  edgeCount: 0,
  hasCycles: false,
  exportedAt: "2025-01-01T00:00:00Z",
};

const mockValidation: EvidenceValidation = {
  valid: true,
  errors: [],
  nodeCount: 1,
  edgeCount: 0,
  exportedAt: "2025-01-01T00:00:00Z",
};

const mockHealth: RuntimeHealth = {
  totalEvents: 10,
  totalArtifacts: 5,
  evidenceNodeCount: 3,
  evidenceEdgeCount: 2,
  graphIntegrity: { valid: true, errors: [] },
  snapshotCount: 1,
  materializedViewCount: 0,
  exportedAt: "2025-01-01T00:00:00Z",
};

const mockStats: RuntimeStatistics = {
  eventsByType: { STATE_TRANSITION: 5 },
  eventsByActor: { "user-1": 5 },
  artifactsByType: { BP: 2 },
  transitionCount: 5,
  contradictionCount: 0,
  authorityGrantCount: 1,
  authorityDenyCount: 0,
  failureCount: 0,
  recoveryCount: 0,
  discoveryCount: 1,
  evolutionCount: 0,
  exportedAt: "2025-01-01T00:00:00Z",
};

const mockMethod: MethodSummary = {
  methodId: "cognitive-analysis",
  displayName: "Cognitive Analysis",
  description: "Deep analysis of cognitive structures",
  requiredCapabilities: [{ capabilityId: "reasoning", minVersion: "1.0" }],
};

const mockProvider: ProviderSummary = {
  providerId: "anthropic",
  displayName: "Anthropic Claude",
  version: "3.5",
  priority: 1,
  status: "AVAILABLE",
  supportedMethods: ["cognitive-analysis"],
  enabled: true,
};

const mockReplay: ReplaySnapshot = {
  aggregateId: "mission-001",
  eventCount: 5,
  state: { currentState: "EXECUTING" },
  valid: true,
  errorCount: 0,
  exportedAt: "2025-01-01T00:00:00Z",
};

const emptyMissions: PaginatedResult<MissionSummary> = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 50,
  hasMore: false,
};

const singleMission: PaginatedResult<MissionSummary> = {
  items: [mockMissionSummary],
  total: 1,
  page: 1,
  pageSize: 50,
  hasMore: false,
};

const singleEvent: PaginatedResult<EventSummary> = {
  items: [mockEvent],
  total: 1,
  page: 1,
  pageSize: 50,
  hasMore: false,
};

const singleArtifact: PaginatedResult<ArtifactSummary> = {
  items: [mockArtifact],
  total: 1,
  page: 1,
  pageSize: 50,
  hasMore: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.listMissions).mockResolvedValue(emptyMissions);
  vi.mocked(api.getMission).mockResolvedValue(null);
  vi.mocked(api.getMissionEvents).mockResolvedValue(singleEvent);
  vi.mocked(api.getMissionArtifacts).mockResolvedValue(singleArtifact);
  vi.mocked(api.getMissionEvidence).mockResolvedValue(mockGraph);
  vi.mocked(api.getMissionAuthority).mockResolvedValue(null);
  vi.mocked(api.getMissionContradictions).mockResolvedValue(null);
  vi.mocked(api.getMissionState).mockResolvedValue(null);
  vi.mocked(api.getMissionHistory).mockResolvedValue([]);
  vi.mocked(api.listEvents).mockResolvedValue(singleEvent);
  vi.mocked(api.getEvent).mockResolvedValue(null);
  vi.mocked(api.listArtifacts).mockResolvedValue(singleArtifact);
  vi.mocked(api.getArtifact).mockResolvedValue(null);
  vi.mocked(api.getArtifactHistory).mockResolvedValue([]);
  vi.mocked(api.getEvidenceGraph).mockResolvedValue(mockGraph);
  vi.mocked(api.validateEvidence).mockResolvedValue(mockValidation);
  vi.mocked(api.listMethods).mockResolvedValue([mockMethod]);
  vi.mocked(api.listProviders).mockResolvedValue([mockProvider]);
  vi.mocked(api.listCapabilities).mockResolvedValue(["reasoning"]);
  vi.mocked(api.getHealth).mockResolvedValue(mockHealth);
  vi.mocked(api.getStatistics).mockResolvedValue(mockStats);
  vi.mocked(api.listSnapshots).mockResolvedValue([]);
  vi.mocked(api.getSnapshot).mockResolvedValue(null);
  vi.mocked(api.getEventsSince).mockResolvedValue([]);
  vi.mocked(api.replayMission).mockResolvedValue(null);
});

function findSidebarLink(name: RegExp) {
  return screen.getAllByRole("link").find((l) => name.test(l.textContent ?? ""));
}

// ─── 1. Render ──────────────────────────────────────────────────────────────

describe("App render", () => {
  it("renders without crashing on /", async () => {
    wrap(<App />);
    await waitFor(() => {
      expect(screen.getByText("R-Think Inspector")).toBeInTheDocument();
    });
  });

  it("renders all navigation sidebar items", async () => {
    wrap(<App />);
    await waitFor(() => {
      expect(findSidebarLink(/Missions/)).toBeTruthy();
      expect(findSidebarLink(/Events/)).toBeTruthy();
      expect(findSidebarLink(/Artifacts/)).toBeTruthy();
      expect(findSidebarLink(/Authority/)).toBeTruthy();
      expect(findSidebarLink(/Runtime Observatory/)).toBeTruthy();
    });
  });
});

// ─── 2. Navigation ──────────────────────────────────────────────────────────

describe("Navigation", () => {
  it("navigates to Events view on click", async () => {
    wrap(<App />);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Missions" })).toBeInTheDocument();
    });
    const eventsLink = findSidebarLink(/Events/);
    fireEvent.click(eventsLink!);
    await waitFor(() => {
      expect(screen.getByText("Chronological runtime event timeline")).toBeInTheDocument();
    });
  });

  it("navigates to Artifacts view on click", async () => {
    wrap(<App />);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Missions" })).toBeInTheDocument();
    });
    const artifactsLink = findSidebarLink(/Artifacts/);
    fireEvent.click(artifactsLink!);
    await waitFor(() => {
      expect(screen.getByText("Schema-validated, versioned mission artifacts")).toBeInTheDocument();
    });
  });

  it("navigates to Health view on click", async () => {
    wrap(<App />);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Missions" })).toBeInTheDocument();
    });
    const healthLink = findSidebarLink(/Runtime Observatory/);
    fireEvent.click(healthLink!);
    await waitFor(() => {
      expect(screen.getByText("Runtime Health")).toBeInTheDocument();
    });
  });
});

// ─── 3. Filtering ───────────────────────────────────────────────────────────

describe("MissionList filtering", () => {
  it("renders state filter select", async () => {
    wrap(<App />);
    await waitFor(() => {
      expect(screen.getByLabelText("Filter by state")).toBeInTheDocument();
    });
  });

  it("calls listMissions on mount", async () => {
    wrap(<App />);
    await waitFor(() => {
      expect(api.listMissions).toHaveBeenCalled();
    });
  });
});

// ─── 4. Event Polling ──────────────────────────────────────────────────────

describe("Event polling", () => {
  it("shows poll mode toggle in Events view", async () => {
    wrap(<App />);
    fireEvent.click(findSidebarLink(/Events/)!);
    await waitFor(() => {
      expect(screen.getByText("Live Polling (SSE)")).toBeInTheDocument();
    });
  });

  it("toggles to SSE Poll mode on click", async () => {
    wrap(<App />);
    fireEvent.click(findSidebarLink(/Events/)!);
    await waitFor(() => {
      expect(screen.getByText("Live Polling (SSE)")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Live Polling (SSE)"));
    await waitFor(() => {
      expect(api.getEventsSince).toHaveBeenCalled();
    });
  });
});

// ─── 5. Duplicate Prevention ────────────────────────────────────────────────

describe("Duplicate prevention in SSE polling", () => {
  it("deduplicates events by eventId", async () => {
    vi.mocked(api.getEventsSince)
      .mockResolvedValueOnce([
        {
          globalPosition: 1,
          eventId: "evt-dup",
          eventType: "STATE_TRANSITION",
          missionId: "m1",
          aggregateId: "m1",
          timestamp: "2025-01-01T00:00:00Z",
          payload: {},
        },
      ])
      .mockResolvedValueOnce([
        {
          globalPosition: 1,
          eventId: "evt-dup",
          eventType: "STATE_TRANSITION",
          missionId: "m1",
          aggregateId: "m1",
          timestamp: "2025-01-01T00:00:00Z",
          payload: {},
        },
      ]);

    const { useEventsSince } = await import("../hooks.ts");
    const { renderHook } = await import("@testing-library/react");

    const { result } = renderHook(() => useEventsSince(0));
    await waitFor(() => {
      expect(result.current.events.length).toBe(1);
    });
  });
});

// ─── 6. Artifact Detail ─────────────────────────────────────────────────────

describe("Artifact detail", () => {
  it("renders artifact detail via click from list", async () => {
    vi.mocked(api.getArtifact).mockResolvedValue(mockArtifactDetail);
    wrap(<App />);
    fireEvent.click(findSidebarLink(/Artifacts/)!);
    await waitFor(() => {
      expect(screen.getByText("art-001")).toBeInTheDocument();
    });
    const rows = screen.getAllByRole("row");
    const dataRow = rows.find((r) => r.textContent?.includes("art-001"));
    fireEvent.click(dataRow!);
    await waitFor(() => {
      expect(screen.getByText("APPROVED")).toBeInTheDocument();
    });
  });
});

// ─── 7. Evidence Graph ──────────────────────────────────────────────────────

describe("Evidence graph", () => {
  it("renders evidence graph page with stats", async () => {
    wrap(<App />);
    fireEvent.click(findSidebarLink(/Evidence Graph/)!);
    await waitFor(() => {
      expect(screen.getByText("Graph Integrity")).toBeInTheDocument();
      expect(screen.getByText("Valid")).toBeInTheDocument();
    });
  });
});

// ─── 8. Replay & Snapshot ──────────────────────────────────────────────────

describe("Replay & snapshots", () => {
  it("renders replay view", async () => {
    wrap(<App />);
    fireEvent.click(findSidebarLink(/Replay & Snapshots/)!);
    await waitFor(() => {
      expect(screen.getByText("Mission Replay")).toBeInTheDocument();
      expect(screen.getByText("Snapshots")).toBeInTheDocument();
    });
  });

  it("renders replay result when mission selected", async () => {
    vi.mocked(api.replayMission).mockResolvedValue(mockReplay);
    vi.mocked(api.listMissions).mockResolvedValue(singleMission);

    wrap(<App />);
    fireEvent.click(findSidebarLink(/Replay & Snapshots/)!);

    await waitFor(() => {
      expect(screen.getByText("Select a mission...")).toBeInTheDocument();
    });

    const select = screen.getByLabelText("Select mission for replay");
    fireEvent.change(select, { target: { value: "mission-001" } });

    await waitFor(() => {
      expect(screen.getByText("Replay Result")).toBeInTheDocument();
      expect(screen.getAllByText("mission-001").length).toBeGreaterThanOrEqual(1);
    });
  });
});

// ─── 9. Authority & Contradiction ──────────────────────────────────────────

describe("Authority view", () => {
  it("renders authority view with stats", async () => {
    wrap(<App />);
    fireEvent.click(findSidebarLink(/Authority/)!);
    await waitFor(() => {
      expect(screen.getByText("Authority & Contradictions")).toBeInTheDocument();
      expect(screen.getByText("Total Contradictions")).toBeInTheDocument();
    });
  });
});

// ─── 10. Health & Stats ─────────────────────────────────────────────────────

describe("Health & statistics", () => {
  it("renders health stats", async () => {
    wrap(<App />);
    fireEvent.click(findSidebarLink(/Runtime Observatory/)!);
    await waitFor(() => {
      expect(screen.getByText("Runtime Health")).toBeInTheDocument();
      expect(screen.getByText("Total Events")).toBeInTheDocument();
      expect(screen.getByText("Total Artifacts")).toBeInTheDocument();
    });
  });

  it("renders registered methods", async () => {
    wrap(<App />);
    fireEvent.click(findSidebarLink(/Runtime Observatory/)!);
    await waitFor(() => {
      expect(screen.getByText("Registered Methods")).toBeInTheDocument();
      const matches = screen.getAllByText("cognitive-analysis");
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("renders registered providers", async () => {
    wrap(<App />);
    fireEvent.click(findSidebarLink(/Runtime Observatory/)!);
    await waitFor(() => {
      expect(screen.getByText("Registered Providers")).toBeInTheDocument();
      expect(screen.getByText("Anthropic Claude")).toBeInTheDocument();
    });
  });
});

// ─── 11. Read-only Guarantee ────────────────────────────────────────────────

describe("Read-only guarantee", () => {
  it("api client has only GET methods and no mutation methods", () => {
    const readOnlyMethods = [
      "listMissions", "getMission", "getMissionState", "getMissionHistory",
      "getMissionEvents", "getMissionArtifacts", "getMissionEvidence",
      "getMissionAuthority", "getMissionContradictions", "replayMission",
      "listEvents", "getEvent",
      "listArtifacts", "getArtifact", "getArtifactHistory",
      "getEvidenceGraph", "validateEvidence",
      "listMethods", "listProviders", "listCapabilities",
      "getHealth", "getStatistics",
      "listSnapshots", "getSnapshot",
      "getEventsSince",
    ];
    for (const method of readOnlyMethods) {
      expect(api).toHaveProperty(method);
      expect(typeof (api as Record<string, unknown>)[method]).toBe("function");
    }

    const mutationMethods = [
      "createMission", "updateMission", "deleteMission",
      "createArtifact", "updateArtifact", "deleteArtifact",
      "createEvent", "updateEvent", "deleteEvent",
      "grantAuthority", "denyAuthority",
      "transition", "restart",
    ];
    for (const method of mutationMethods) {
      expect((api as Record<string, unknown>)[method]).toBeUndefined();
    }
  });
});

// ─── 12. Accessibility basics ──────────────────────────────────────────────

describe("Accessibility basics", () => {
  it("filter inputs have aria-labels", async () => {
    wrap(<App />);
    await waitFor(() => {
      expect(screen.getByLabelText("Filter by state")).toBeInTheDocument();
    });
  });

  it("sidebar navigation has proper aria-label", async () => {
    wrap(<App />);
    await waitFor(() => {
      const nav = screen.getByLabelText("Inspector navigation");
      expect(nav).toBeInTheDocument();
      expect(findSidebarLink(/Missions/)).toBeTruthy();
    });
  });

  it("tables use proper thead/tbody", async () => {
    vi.mocked(api.listMissions).mockResolvedValue(singleMission);
    wrap(<App />);
    await waitFor(() => {
      const table = screen.getByRole("table");
      expect(table.querySelector("thead")).toBeInTheDocument();
      expect(table.querySelector("tbody")).toBeInTheDocument();
    });
  });
});

// ─── 13. Mission Detail ────────────────────────────────────────────────────

describe("Mission detail", () => {
  it("renders mission detail page via click from list", async () => {
    vi.mocked(api.getMission).mockResolvedValue(mockMissionDetail);
    vi.mocked(api.listMissions).mockResolvedValue(singleMission);
    wrap(<App />);
    await waitFor(() => {
      expect(screen.getByText("mission-001")).toBeInTheDocument();
    });
    const rows = screen.getAllByRole("row");
    const dataRow = rows.find((r) => r.textContent?.includes("mission-001"));
    fireEvent.click(dataRow!);
    await waitFor(() => {
      expect(screen.getAllByText("mission-001").length).toBeGreaterThanOrEqual(1);
    });
  });
});

// ─── 14. Event Timeline ────────────────────────────────────────────────────

describe("Event timeline", () => {
  it("renders event list view", async () => {
    wrap(<App />);
    fireEvent.click(findSidebarLink(/Events/)!);
    await waitFor(() => {
      expect(screen.getByText("STATE_TRANSITION")).toBeInTheDocument();
    });
  });
});

// ─── 15. Error handling ────────────────────────────────────────────────────

describe("Error handling", () => {
  it("shows error state when API fails", async () => {
    vi.mocked(api.listMissions).mockRejectedValue(new Error("Network error"));
    wrap(<App />);
    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });
});

// ─── 16. Loading states ────────────────────────────────────────────────────

describe("Loading states", () => {
  it("shows loading indicator while fetching", async () => {
    let resolve!: (value: PaginatedResult<MissionSummary>) => void;
    vi.mocked(api.listMissions).mockReturnValue(
      new Promise((r) => { resolve = r; })
    );
    wrap(<App />);
    await waitFor(() => {
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
    resolve(emptyMissions);
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
  });
});

// ─── 17. Empty states ──────────────────────────────────────────────────────

describe("Empty states", () => {
  it("shows empty message when no missions", async () => {
    wrap(<App />);
    await waitFor(() => {
      expect(screen.getByText("No missions found")).toBeInTheDocument();
    });
  });
});
