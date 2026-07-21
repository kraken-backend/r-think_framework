import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.tsx";
import MissionList from "./views/MissionList.tsx";
import MissionDetail from "./views/MissionDetail.tsx";
import EventTimeline from "./views/EventTimeline.tsx";
import ArtifactList from "./views/ArtifactList.tsx";
import ArtifactDetail from "./views/ArtifactDetail.tsx";
import EvidenceGraph from "./views/EvidenceGraph.tsx";
import AuthorityView from "./views/AuthorityView.tsx";
import ReplayView from "./views/ReplayView.tsx";
import HealthView from "./views/HealthView.tsx";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/missions" replace />} />
        <Route path="/missions" element={<MissionList />} />
        <Route path="/missions/:missionId" element={<MissionDetail />} />
        <Route path="/events" element={<EventTimeline />} />
        <Route path="/artifacts" element={<ArtifactList />} />
        <Route path="/artifacts/:artifactId" element={<ArtifactDetail />} />
        <Route path="/evidence" element={<EvidenceGraph />} />
        <Route path="/authority" element={<AuthorityView />} />
        <Route path="/replay" element={<ReplayView />} />
        <Route path="/health" element={<HealthView />} />
      </Routes>
    </Layout>
  );
}

export default App;
