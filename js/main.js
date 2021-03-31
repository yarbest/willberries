const mySwiper = new Swiper('.swiper-container', {
    loop: true,

    // Navigation arrows
    navigation: {
        nextEl: '.slider-button-next',
        prevEl: '.slider-button-prev',
    },
});

//Cart
(function () {
    const buttonCart = document.querySelector('.button-cart');
    const modalCart = document.querySelector('#modal-cart');

    const openModal = () => modalCart.classList.add('show');

    const closeModal = () => modalCart.classList.remove('show');

    buttonCart.addEventListener('click', openModal);

    modalCart.addEventListener('click', (event) => {
        const target = event.target;
        if (target.matches('#modal-cart, .modal-close')) closeModal();
    });
})();

//smooth scroll
(function () {
    const scrollLinks = document.querySelectorAll('a[href*="#"]');

    const scrollToBlock = (event, link) => {
        event.preventDefault();
        let currentBlock = document.querySelector(link.getAttribute('href')); // elem.getAttribute('href') вернет нам id того блока, на который ведет эта ссылка
        let currentWindowScroll = window.pageYOffset; //начинаем прокручивать страницу из текущего значения прокрутки, чтобы не телепортироваться
        let scrollHeigthPerMove = Math.abs(currentWindowScroll - currentBlock.offsetTop) > document.documentElement.clientHeight ? 60 : 30; //если расстояние от окна до блока больше чем высота окна, то прокручивай быстро, то есть если блок не видно на текущем окне, то нужно быстро прокручивать
        //Если в данный момент окно прокручено дальше, чем располагается нужный блок, то нужно прокручивать на верх, уменьшая значение currentWindowScroll
        if (currentWindowScroll >= currentBlock.offsetTop) {
            const scrollAbove = () => {
                currentWindowScroll -= scrollHeigthPerMove;
                if (currentWindowScroll <= currentBlock.offsetTop) {
                    //если окно прокрутили выше чем нужный блок, то останавливаемся и устанавливаем окно пользователя на уровне с верхушкой нужного блока
                    document.documentElement.scrollTo(0, currentBlock.offsetTop);
                    return;
                }
                document.documentElement.scrollTo(0, currentWindowScroll); //потихоньку прокручиваем окно
                requestAnimationFrame(scrollAbove);
            };

            requestAnimationFrame(scrollAbove);
        }
        //Если в данный момент окно находится выше, чем располагается нужный блок то нужно прокручивать вниз увеличивая значение currentWindowScroll
        if (currentWindowScroll <= currentBlock.offsetTop) {
            const scrollBellow = () => {
                currentWindowScroll += scrollHeigthPerMove;
                if (currentWindowScroll >= currentBlock.offsetTop) {
                    //если окно прокрутили ниже чем блок, то останавливаемся и устанавливаем окно пользователя на уровне с верхушкой нужного блока
                    document.documentElement.scrollTo(0, currentBlock.offsetTop); //эта строчка обязательно нужна, так как окно нужно поставить ровно с блоком, иначе может быть сдвиг
                    return;
                }

                document.documentElement.scrollTo(0, currentWindowScroll); //потихоньку прокручиваем окно
                requestAnimationFrame(scrollBellow);
            };
            requestAnimationFrame(scrollBellow);
        }
    };

    scrollLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            scrollToBlock(event, link);
        });
    });
})();
