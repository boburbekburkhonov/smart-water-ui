import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Login from './Pages/Login/Login'
import User from './Pages/User/User'

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/user/*" element={<User />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
