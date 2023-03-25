import React from "react";
import { Button, InputGroup, Label } from "@blueprintjs/core";

// TODO - look into clerking this
const App = () => {
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        padding: "32px 0",
        height: "100%",
      }}
    >
      <style>{`html, body, #app { height: 100%; }`}</style>
      <div style={{ height: 160, width: 160 }}>
        <img
          src="https://samepage.network/images/logo.png"
          height={160}
          width={160}
        />
      </div>
      <h1>Welcome to SamePage</h1>
      {isSignUp ? (
        <>
          <p>If you have a SamePage account, sign in to get started.</p>
          <Label className={"w-1/2"}>
            Email
            <InputGroup
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              type={"text"}
              name={"email"}
              style={{ maxWidth: 320 }}
            />
          </Label>
          <Label className={"w-1/2"}>
            Password
            <InputGroup
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={"password"}
              name={"password"}
              style={{ maxWidth: 320 }}
            />
          </Label>
          <Button
            style={{
              padding: "4px 32px",
              marginBottom: 32,
            }}
            intent={"primary"}
          >
            Sign In
          </Button>
          <p>Don't have an account yet?</p>
          <p
            style={{
              color: "skyblue",
              cursor: "pointer",
              textDecoration: "underline",
            }}
            onClick={() => setIsSignUp(true)}
          >
            Create your SamePage account
          </p>
        </>
      ) : (
        <>
          <p>If you don't have a SamePage account, sign up to get started.</p>
          <Label className={"w-1/2"}>
            Email
            <InputGroup
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              type={"text"}
              name={"email"}
              style={{ maxWidth: 320 }}
            />
          </Label>
          <Label className={"w-1/2"}>
            Password
            <InputGroup
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={"password"}
              name={"password"}
              style={{ maxWidth: 320 }}
            />
          </Label>
          <Button
            style={{
              padding: "4px 32px",
              marginBottom: 32,
            }}
            intent={"primary"}
          >
            Sign Up
          </Button>
          <p>Already have an account?</p>
          <p
            style={{
              color: "skyblue",
              cursor: "pointer",
              textDecoration: "underline",
            }}
            onClick={() => setIsSignUp(true)}
          >
            Click here to log in
          </p>
        </>
      )}

      <div style={{ flexGrow: 1 }} />
      <div>SamePage version {chrome.runtime.getManifest().version}</div>
    </div>
  );
};

export default App;
