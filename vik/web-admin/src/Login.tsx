import { buildLoginUrl } from "./auth";

export function Login() {
  return (
    <div className="vik-admin__login">
      <h1>Vik Admin</h1>
      <p>Sign in with Keycloak to view captured leads.</p>
      <a className="vik-admin__button" href={buildLoginUrl()}>
        Sign in with Keycloak
      </a>
    </div>
  );
}
