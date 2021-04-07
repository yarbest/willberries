'use strict';

const mySwiper = new Swiper('.swiper-container', {
    loop: true,

    // Navigation arrows
    navigation: {
        nextEl: '.slider-button-next',
        prevEl: '.slider-button-prev',
    },
});

//get goods
//при каждом добавлении товара в корзину и при каждом выборе категории - у нас происходило обращение к серверу, поэтому мы 1 раз сохраним ответ от сервера в отдельную переменную, и будем к ней обращаться при помощи замыкания
const copyGoods = () => {
    const data = []; //эта переменная будет замкнута с анонимной функцией

    return async () => {
        if (data.length) return data; //если данные уже были загружены, то больше не надо

        const response = await fetch('db/db.json'); //пока эта строчка не выполнится - следующая не начнется
        if (response.ok) {
            data.push(...(await response.json()));
            return data; //в одну строчку записать не получается, тогда возвращается просто кол-во элементов, потому-что push возвращает колво аргументов, которое ему передали
        } else throw new Error('Error ' + response.status);
    };
};
const getGoods = copyGoods(); //в getGoods лежит асинхронная функция, которая возвращает промис, в котором лежит массив данных

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

//cart
(function () {
    //Часть, ответсвенная за работу корзины
    const cartTableGoods = document.querySelector('.cart-table__goods');
    const cartTableTotal = document.querySelector('.cart-table__total');
    const cartCount = document.querySelector('.cart-count');
    const btnClearCart = document.querySelector('.btn-clear-cart');

    const cart = {
        cartGoods: [],

        renderCart() {
            cartTableGoods.textContent = '';
            this.cartGoods.forEach(({ id, name, price, count }) => {
                const trGood = document.createElement('tr');
                trGood.className = 'cart-item';
                trGood.dataset.id = id;

                trGood.innerHTML = `
                    <td>${name}</td>
                    <td>${price}$</td>
                    <td><button class="cart-btn-minus">-</button></td>
                    <td>${count}</td>
                    <td><button class="cart-btn-plus">+</button></td>
                    <td>${price * count}$</td>
                    <td><button class="cart-btn-delete">x</button></td>
                `;
                cartTableGoods.append(trGood);
            });

            const totalPrice = this.cartGoods.reduce((total, goodInfo) => {
                return total + goodInfo.price * goodInfo.count;
            }, 0);

            cartTableTotal.textContent = totalPrice === 0 ? '' : totalPrice + '$';

            this.changeCartCount();
        },

        addGood(id) {
            const goodInfo = cart.cartGoods.find((goodInfo) => goodInfo.id === id);
            //если в карзине уже есть товар, который пытаемся добавить, то в корзине нужно просто увеличить count для данного товара, а не добавлять еще такой же
            if (goodInfo) {
                this.plusGood(id);
                this.changeCartCount();
            } else {
                getGoods()
                    .then((result) => result.find((goodInfo) => goodInfo.id === id)) //вернет объект с данными о товаре, у которого индекс равен индексу кнопки Shop Now, на которую нажали
                    .then(({ id, name, price }) => {
                        this.cartGoods.push({ id, name, price, count: 1 }); //добавляем в cartGoods, информацию из нужного товара
                        this.changeCartCount();
                        cart.renderCart();
                    })
                    .catch((err) => console.error('Ошибка: ' + err));
            }
        },

        deleteGood(id) {
            this.cartGoods.forEach((goodInfo, i, arr) => {
                if (goodInfo.id === id) arr.splice(i, 1);
            });
            this.renderCart();
        },

        minusGood(id) {
            this.cartGoods.forEach((goodInfo) => {
                if (goodInfo.id === id) {
                    if (goodInfo.count === 1) return;
                    goodInfo.count--;
                }
            });
            this.renderCart();
        },

        plusGood(id) {
            this.cartGoods.forEach((goodInfo) => {
                if (goodInfo.id === id) {
                    if (goodInfo.count === 10) return;
                    goodInfo.count++;
                }
            });
            this.renderCart();
        },

        clearCart() {
            this.cartGoods.length = 0;
            this.renderCart();
        },

        changeCartCount() {
            cartCount.textContent = this.cartGoods.reduce((sum, goodInfo) => sum + goodInfo.count, 0);
            cartCount.textContent = cartCount.textContent === '0' ? '' : cartCount.textContent;
        },
    };

    btnClearCart.addEventListener('click', cart.clearCart.bind(cart)); //из-за слушателя событий у нас теряется this, при вызове cart.clearCart, так как у нас тут не стрелочная функ-ция, то используем bind, он привяжет нужный this

    //Делегирование
    cartTableGoods.addEventListener('click', (event) => {
        const target = event.target;

        if (target.tagName === 'BUTTON') {
            const goodId = target.closest('.cart-item').dataset.id;

            if (target.matches('.cart-btn-plus')) cart.plusGood(goodId);
            else if (target.matches('.cart-btn-minus')) cart.minusGood(goodId);
            else if (target.matches('.cart-btn-delete')) cart.deleteGood(goodId);
        }
    });

    document.body.addEventListener('click', (event) => {
        const btnAddToCart = event.target.closest('.add-to-cart');
        if (btnAddToCart) {
            btnAddToCart.classList.add('active');
            cart.addGood(btnAddToCart.dataset.id);
        }
    });
})();

//modal
(function () {
    //Часть, ответсвенная за модальное окно
    const buttonCart = document.querySelector('.button-cart');
    const modalCart = document.querySelector('#modal-cart');

    //при открытии модального окна, еще будет рендериться корзина
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
    const chooseCategoryElems = document.querySelectorAll('.navigation-link, .show-category-goods, .more');
    const longGoodsList = document.querySelector('.long-goods-list');

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
        const cardElements = cardsInfo.map((goodInfo) => createCardElement(goodInfo)); //получаем массив HTML-элементов
        longGoodsList.append(...cardElements); //append может сразу принимать несколько аргументов для вставки на страницу, через запятую, а spread оператор разложит элементы массива как раз через запятую

        document.body.classList.add('show-goods'); //при наличии этого класса у body, на странице скроется слайдер, и блок с товарами, но появится другой (длинный)
    };

    //При нажатии на ссылки в навигации, будут считываться их дата-атрибуты и на основе их будут выводиться товары
    const filterCards = (key, value) => {
        getGoods()
            .then((result) => {
                const filtered = result.filter((goodInfo) => goodInfo[key] === value); //если взятые key и value, из дата-атрибутов, совпадают со значнием текущего объекта, то этот объект подходит
                renderCards(filtered);
            })
            .catch((err) => console.error(err));
    };

    //показываем товары только нужной категории, но если была нажата кнопка All или View All, то у них нету дата-атрибутов, и в функцию filterCards передадутся два undefined, и там при фильтрации, будет условие goodInfo[undefined] === undefined -> true, и так как функция фльтрации на всех элементах вернет true, то все товары выведутся на странице
    chooseCategoryElems.forEach((item) => {
        item.addEventListener('click', (event) => {
            event.preventDefault();
            filterCards(item.dataset.key, item.dataset.value);
            setTimeout(() => scrollToBlock(event), 200); //если в scrollToBlock не передать второй аргумент, то прокрутка будет на самый верх, до body
        });
    });
})();
