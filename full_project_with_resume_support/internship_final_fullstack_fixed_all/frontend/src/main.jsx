import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import ToastContainer from './components/ToastContainer'
import Home from './pages/Home'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import Internships from './pages/Internships'
import FacultyValidate from './pages/FacultyValidate'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AddJob from './pages/AddJob'    
import './styles.css'
import Applications from './pages/Applications'
import MyApplications from './pages/MyApplications'
import AdminUsers from './pages/AdminUsers'
import About from './pages/About'
import Contact from './pages/Contact'
import Footer from './components/Footer'

function App(){
  return (
    <BrowserRouter>
      <Header />
      <ToastContainer />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route path='/' element={<Home/>} />

          <Route path='/jobs' element={<Jobs/>} />
          <Route path='/jobs/new' element={<AddJob/>} />       
          <Route path='/jobs/:id' element={<JobDetail/>} />
          <Route path='/internships' element={<Internships/>} />
          <Route path='/faculty' element={<FacultyValidate/>} />
          <Route path='/admin/users' element={<AdminUsers/>} />
          <Route path="/applications" element={<Applications/>} />
          <Route path="/my-applications" element={<MyApplications/>} />
          <Route path='/login' element={<Login/>} />
          <Route path='/signup' element={<Signup/>} />
          <Route path='/about' element={<About/>} />
          <Route path='/contact' element={<Contact/>} />
        </Routes>
      </div>
      <Footer />
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(<App />)
