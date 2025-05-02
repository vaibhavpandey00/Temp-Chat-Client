import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div className="bg-gradient-to-bl from-[#ffe4e6]  to-[#ccfbf1]">
      <App />
      <ToastContainer
        position='top-center'
        autoClose={2000}
        limit={3}
        closeButton={false}
        pauseOnHover={false}
        pauseOnFocusLoss={false}
        draggable={true}
      />
    </div>

  </StrictMode>,
)
