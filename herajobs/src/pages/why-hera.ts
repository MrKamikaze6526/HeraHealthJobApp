export function renderWhyHera() {
  return `
    <section class="hero bg-[#e6f3ff] py-16 text-center">
      <div class="container mx-auto px-4">
        <h2 class="text-5xl font-extrabold text-[#003366] mb-6" data-aos="fade-down">Why Hera?</h2>
        <p class="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed" data-aos="fade-up">
          At Hera Health Solutions, we are transforming healthcare through sustainable, pain-free, and long-acting drug delivery systems that empower patients and providers alike.
        </p>
      </div>
    </section>

    <section class="why-blocks py-20 bg-white">
      <div class="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-10 text-center">

        <div class="block bg-[#f8fbff] p-8 rounded-2xl shadow-md hover:shadow-xl transition duration-300" data-aos="fade-up">
          <img src="https://cdn-icons-png.flaticon.com/512/599/599305.png" alt="Innovation icon" class="w-12 h-12 mx-auto mb-4"/>
          <h3 class="text-2xl font-semibold text-[#003366] mb-4">Purpose-Driven Innovation</h3>
          <p class="text-gray-600 leading-relaxed">
            Our team of biomedical engineers is pioneering biodegradable drug delivery implants that eliminate painful removal procedures. We focus on solving real-world issues that patients and physicians face daily.
          </p>
        </div>

        <div class="block bg-[#f8fbff] p-8 rounded-2xl shadow-md hover:shadow-xl transition duration-300" data-aos="fade-up" data-aos-delay="100">
          <img src="https://cdn-icons-png.flaticon.com/512/942/942748.png" alt="Growth icon" class="w-12 h-12 mx-auto mb-4"/>
          <h3 class="text-2xl font-semibold text-[#003366] mb-4">Empowered Growth</h3>
          <p class="text-gray-600 leading-relaxed">
            At Hera, we empower every member of our team—from interns to executives—with mentorship, leadership opportunities, and hands-on experience in shaping the future of drug delivery technology.
          </p>
        </div>

        <div class="block bg-[#f8fbff] p-8 rounded-2xl shadow-md hover:shadow-xl transition duration-300" data-aos="fade-up" data-aos-delay="200">
          <img src="https://cdn-icons-png.flaticon.com/512/744/744465.png" alt="Culture icon" class="w-12 h-12 mx-auto mb-4"/>
          <h3 class="text-2xl font-semibold text-[#003366] mb-4">Mission-Driven Culture</h3>
          <p class="text-gray-600 leading-relaxed">
            We cultivate a culture of collaboration and inclusion, where every voice matters. Our shared mission is to make healthcare more equitable, accessible, and innovative for everyone.
          </p>
        </div>

      </div>
    </section>

    <section class="callout bg-[#e6f3ff] py-16 text-center">
      <div class="container max-w-3xl mx-auto px-4" data-aos="fade-in">
        <h3 class="text-3xl font-bold text-[#003366] mb-4">Join Us in Revolutionizing Healthcare</h3>
        <p class="text-lg text-gray-700 leading-relaxed mb-6">
          Hera Health Solutions is led by passionate engineers, scientists, and change-makers redefining the future of long-acting medicine—one biodegradable implant at a time.
        </p>
        <a href="/careers" class="inline-block bg-[#003366] text-white px-6 py-3 rounded-full text-lg font-medium hover:bg-[#0055aa] transition">
          Explore Careers
        </a>
      </div>
    </section>
  `;
}
