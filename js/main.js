'use strict';

const mySwiper = new Swiper('.swiper-container', {
    loop: true,

    // Navigation arrows
    navigation: {
        nextEl: '.slider-button-next',
        prevEl: '.slider-button-prev',
    },
});

//Modal
(function () {
    const buttonCart = document.querySelector('.button-cart');
    const modalCart = document.querySelector('#modal-cart');

    const openModal = () => {
        modalCart.classList.add('show');

        document.body.style.paddingRight = `${window.innerWidth - document.documentElement.offsetWidth}px`; //компенсируем сдвиг, при убирании полосы прокрутки
        document.body.style.overflow = 'hidden'; //эта строка должна стоять после добавления отступа для body, так как при overflow = 'hidden' полоса прокрутки пропадает, и window.innerWidth уменьшается, и значение paddinga будет не правильным

        document.addEventListener('keydown', closeModal); //обработчик на document висит только при открытом модальном окне, НО, теперь при нажатии на ЛЮБУЮ клавишу - будет закрываться модалка, поэтому это нужно отловить при закрытии, нужно только при escape
    };

    const closeModal = (event) => {
        if (event.type === 'keydown' && event.key !== 'Escape') return; //если нажали на клавиатуру, но это не Escape, тогда модалку закрывать не нужно

        modalCart.classList.remove('show');
        document.body.removeAttribute('style');
        document.removeEventListener('keydown', closeModal);
    };

    buttonCart.addEventListener('click', openModal);

    modalCart.addEventListener('click', (event) => {
        const target = event.target;
        if (target.matches('#modal-cart') || target.matches('.modal-close')) closeModal(event);
    });
})();

//smooth scroll
const scrollToBlock = (event, link) => {
    event.preventDefault();
    if (link && link.getAttribute('href').length <= 1) return; //защита от того, если в href лежит только # - заглушка

    //в функцию передавать link не обязательно, если его не передали, то прокручиваться будет до верха body
    let currentBlock = link ? document.querySelector(link.getAttribute('href')) : document.body; // elem.getAttribute('href') вернет нам id того блока, на который ведет эта ссылка

    if (currentBlock === null) return; //если блок, на который ведет якорная ссылка не нашелся, то продолжать нет смысла

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

//scroll links
(function () {
    const scrollLinks = document.querySelectorAll('a.scroll-link');
    scrollLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            scrollToBlock(event, link);
        });
    });
})();

//get goods, show goods, filter goods
(function () {
    const btnShowMore = document.querySelector('.more');
    const chooseCategoryElems = document.querySelectorAll('.navigation-link, .btn-show-goods');
    const longGoodsList = document.querySelector('.long-goods-list');

    const getGoods = async () => {
        const response = await fetch('db/db.json'); //пока эта строчка не выполнится - следующая не начнется
        if (response.ok) return response.json();
        else throw new Error('Error ' + response.status);
    };

    //подготавливаем карточку товара для вывода
    const createCardElement = ({ label, img, name, description, id, price }) => {
        const card = document.createElement('div');
        card.classList.add('col-lg-3', 'col-sm-6');
        card.innerHTML = `
            <div class="goods-card">
                ${label ? `<span class="label">${label}</span>` : ''}
                <img src="db/${img}" alt="image: ${name}" class="goods-image" />
                <h3 class="goods-title">${name}</h3>
                <p class="goods-description">${description}</p>
                <button class="button goods-card-btn add-to-cart" data-id="${id}">
                    <span class="button-price">$${price}</span>
                </button>
            </div>
        `;
        return card;
    };

    //выводим карточки товаров
    const renderCards = (cardsInfo) => {
        longGoodsList.textContent = '';

        //На основании каждого объекта с инфой о товаре, создается html-элемент, в который вставляется инфа из этого объекта
        const cardElements = cardsInfo.map((cardInfo) => createCardElement(cardInfo)); //получаем массив HTML-элементов
        longGoodsList.append(...cardElements); //append может сразу принимать несколько аргументов для вставки на страницу, через запятую, а spread оператор разложит элементы массива как раз через запятую

        document.body.classList.add('show-goods'); //при наличии этого класса у body, на странице скроется слайдер, и блок с товарами, но появится другой (длинный)
    };

    //При нажатии на ссылки в навигации, будут считываться их дата-атрибуты и на основе их будут выводиться товары
    const filterCards = (key, value) => {
        getGoods()
            .then((result) => {
                const filtered = result.filter((cardInfo) => cardInfo[key] === value); //если взятые key и value, из дата-атрибутов ссылки, совпадают со значнием текущего объекта, то этот объект подходит
                renderCards(filtered);
            })
            .catch((err) => console.error(err));
    };

    //при нажатии на кнопку, на сервер отправляется запрос, и когда получим ответ, тогда начнет добавлять ВСЕ карточки товаров
    btnShowMore.addEventListener('click', (event) => {
        event.preventDefault();
        getGoods()
            .then((result) => renderCards(result))
            .catch((err) => console.error(err));

        setTimeout(() => scrollToBlock(event, btnShowMore), 500); //пускай сначала загрузятся товары, а потом прогрутим на верх
    });

    //показываем товары только нужной категории
    chooseCategoryElems.forEach((item) => {
        item.addEventListener('click', (event) => {
            event.preventDefault();
            filterCards(item.dataset.key, item.dataset.value);
            setTimeout(() => scrollToBlock(event), 500);
        });
    });
})();
