const mySwiper = new Swiper(".swiper-container", {
    loop: true,

    // Navigation arrows
    navigation: {
        nextEl: ".slider-button-next",
        prevEl: ".slider-button-prev",
    },
});

//Cart
(function () {
    const buttonCart = document.querySelector(".button-cart");
    const modalCart = document.querySelector("#modal-cart");

    const openModal = () => modalCart.classList.add("show");

    const closeModal = () => modalCart.classList.remove("show");

    buttonCart.addEventListener("click", openModal);

    modalCart.addEventListener("click", (event) => {
        const target = event.target;
        if (target.matches("#modal-cart, .modal-close")) closeModal();
    });
})();

//smooth scroll
(function () {
    const scrollLinks = document.querySelectorAll("a.scroll-link");
    scrollLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            const blockId = link.getAttribute("href");
            document.querySelector(blockId).scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        });
    });
})();
