import { useState, useEffect } from "react";
import Landing from "./Landing.jsx";
import Generator from "./Generator.jsx";

export default function App() {
  const [page, setPage] = useState("landing");
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("session_id");
    const path = window.location.pathname;

    if (path === "/generate" && sid) {
      setSessionId(sid);
      setPage("generator");
    } else if (params.get("cancelled")) {
      setPage("landing");
      window.history.replaceState({}, "", "/");
    }
  }, []);

  if (page === "generator") return <Generator sessionId={sessionId} />;
  return <Landing />;
}
