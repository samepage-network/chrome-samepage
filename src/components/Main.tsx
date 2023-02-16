import React from "react";

const Main = () => {
  return (
    <div style={{ height: 120, width: 120 }}>
      <span>Hello, World!</span>
      <button
        onClick={() => console.log("bottles in my eyes", new Date().valueOf())}
      >
        Click me now
      </button>
    </div>
  );
};

export default Main;
