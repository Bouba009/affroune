import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import Admin from "./Admin";

const Root = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    // Check URL on load
    const checkAdmin = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;
      setIsAdmin(hash === '#admin' || hash.startsWith('#/admin') || path === '/admin' || path.startsWith('/admin'));
    };
    
    checkAdmin();
    
    // Listen for hash changes
    window.addEventListener('hashchange', checkAdmin);
    window.addEventListener('popstate', checkAdmin);
    
    return () => {
      window.removeEventListener('hashchange', checkAdmin);
      window.removeEventListener('popstate', checkAdmin);
    };
  }, []);
  
  return isAdmin ? <Admin /> : <App />;
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
