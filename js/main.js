document.addEventListener('DOMContentLoaded', () => {
    // Form validation
    const form = document.getElementById('registration-form');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (validateForm()) {
                submitForm();
            }
        });
    }

    function validateForm() {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required], select[required]');
        inputs.forEach(input => {
            const errorMsg = input.nextElementSibling;
            if (!input.value.trim()) {
                isValid = false;
                errorMsg.textContent = `${input.name} is required.`;
                errorMsg.style.display = 'block';
            } else {
                errorMsg.style.display = 'none';
            }
        });
        return isValid;
    }

    async function submitForm() {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        const submitBtn = form.querySelector('button[type="submit"]');
        const loader = submitBtn.querySelector('.btn-loader');
        const btnText = submitBtn.querySelector('.btn-text');
        const successMsg = document.getElementById('form-success');

        loader.classList.remove('hidden');
        btnText.textContent = 'Submitting...';

        try {
            const response = await fetch('/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                form.reset();
                form.style.display = 'none';
                successMsg.classList.remove('hidden');
            } else {
                throw new Error('Form submission failed');
            }
        } catch (error) {
            alert('There was an error submitting your application. Please try again.');
        } finally {
            loader.classList.add('hidden');
            btnText.textContent = 'Submit Application';
        }
    }

    // Scroll animations
    const animatedElements = document.querySelectorAll('.slide-in-left, .slide-in-right, .slide-in-bottom');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.classList.add('animate');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    animatedElements.forEach(el => {
        observer.observe(el);
    });
});
