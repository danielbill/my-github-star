# Project Rules

## Wails + React Router

When using React Router in a Wails desktop application, **always use `HashRouter` instead of `BrowserRouter`**.

### Reason

Wails AssetServer serves static files. With `BrowserRouter`:
- URL `/settings` on refresh → Wails looks for `/settings` file → 404/white screen
- URL `/#/settings` on refresh → Wails returns `index.html` → React Router handles routing correctly

### Example

```tsx
// Correct
import { HashRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </HashRouter>
  );
}

// Wrong - will cause white screen on refresh for non-root routes
import { BrowserRouter, Routes, Route } from 'react-router-dom';
```
