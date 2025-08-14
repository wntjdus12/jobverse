import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Interview from './components/Interview.jsx'
import Chatbot from './components/Chatbot.jsx'

export default function App() {
  return (
    <BrowserRouter basename="/interview">
      <Routes>
        <Route path="/" element={<Interview />} />
        <Route path="/chat" element={<Chatbot />} />
      </Routes>
    </BrowserRouter>
  )
}
