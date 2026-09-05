import { useEffect, useState } from "react";
import keycloak from "./keycloak";

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    keycloak
      .init({ onLoad: "check-sso", pkceMethod: "S256" })
      .then((auth) => {
        setAuthenticated(auth);
        setInitialized(true);
      });
  }, []);

  if (!initialized) {
    return <p>Loading...</p>;
  }

  if (!authenticated) {
    return (
      <div>
        <h1>Welcome</h1>
        <button onClick={() => keycloak.login()}>Log In</button>
        <button onClick={() => keycloak.register()}>Sign Up</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome, {keycloak.tokenParsed?.preferred_username}!</h1>
      <button onClick={() => keycloak.logout()}>Log Out</button>
    </div>
  );
}

export default App;