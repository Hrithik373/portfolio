import { useState } from "react";
import { completeLoginFromUrl } from "./auth";
import { Dashboard } from "./Dashboard";
import { Login } from "./Login";

function App() {
  const [authenticated] = useState(() => completeLoginFromUrl());
  return authenticated ? <Dashboard /> : <Login />;
}

export default App;
