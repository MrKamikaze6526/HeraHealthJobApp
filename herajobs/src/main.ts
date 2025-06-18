import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="homepage">
    <header class="header">
      <div class="container">
        <h1 class="logo">Hera Health Solutions</h1>
        <nav class="nav">
          <a href="#home">Home</a>
          <a href="#services">Services</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
      </div>
    </header>

    <section class="hero">
      <div class="container">
        <h2>Transforming Healthcare Through Innovation</h2>
        <p>Providing cutting-edge health solutions for a better tomorrow</p>
        <button class="cta-button">Learn More</button>
      </div>
    </section>

    <section class="services">
      <div class="container">
        <h3>Our Services</h3>
        <div class="services-grid">
          <div class="service-card">
            <h4>Digital Health</h4>
            <p>Advanced digital solutions for modern healthcare challenges</p>
          </div>
          <div class="service-card">
            <h4>Analytics</h4>
            <p>Data-driven insights to improve patient outcomes</p>
          </div>
          <div class="service-card">
            <h4>Consulting</h4>
            <p>Expert guidance for healthcare organizations</p>
          </div>
        </div>
      </div>
    </section>

    <footer class="footer">
      <div class="container">
        <p>&copy; 2024 Hera Health Solutions. All rights reserved.</p>
      </div>
    </footer>
  </div>
`
