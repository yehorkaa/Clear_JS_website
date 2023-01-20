window.addEventListener('DOMContentLoaded', function() {

    // Tabs
    
	let tabs = document.querySelectorAll('.tabheader__item'),
		tabsContent = document.querySelectorAll('.tabcontent'),
		tabsParent = document.querySelector('.tabheader__items');

	function hideTabContent() {
        
        tabsContent.forEach(item => {
            item.classList.add('hide');
            item.classList.remove('show', 'fade');
        });

        tabs.forEach(item => {
            item.classList.remove('tabheader__item_active');
        });
	}

	function showTabContent(i = 0) {
        tabsContent[i].classList.add('show', 'fade');
        tabsContent[i].classList.remove('hide');
        tabs[i].classList.add('tabheader__item_active');
    }
    
    hideTabContent();
    showTabContent();

	tabsParent.addEventListener('click', function(event) {
		const target = event.target;
		if(target && target.classList.contains('tabheader__item')) {
            tabs.forEach((item, i) => {
                if (target == item) {
                    hideTabContent();
                    showTabContent(i);
                }
            });
		}
    });
    
    // Timer

    const deadline = '2022-06-11';

    function getTimeRemaining(endtime) {
        const t = Date.parse(endtime) - Date.parse(new Date()),
            days = Math.floor( (t/(1000*60*60*24)) ),
            seconds = Math.floor( (t/1000) % 60 ),
            minutes = Math.floor( (t/1000/60) % 60 ),
            hours = Math.floor( (t/(1000*60*60) % 24) );

        return {
            'total': t,
            'days': days,
            'hours': hours,
            'minutes': minutes,
            'seconds': seconds
        };
    }

    function getZero(num){
        if (num >= 0 && num < 10) { 
            return '0' + num;
        } else {
            return num;
        }
    }

    function setClock(selector, endtime) {

        const timer = document.querySelector(selector),
            days = timer.querySelector("#days"),
            hours = timer.querySelector('#hours'),
            minutes = timer.querySelector('#minutes'),
            seconds = timer.querySelector('#seconds'),
            timeInterval = setInterval(updateClock, 1000);

        updateClock();

        function updateClock() {
            const t = getTimeRemaining(endtime);

            days.innerHTML = getZero(t.days);
            hours.innerHTML = getZero(t.hours);
            minutes.innerHTML = getZero(t.minutes);
            seconds.innerHTML = getZero(t.seconds);

            if (t.total <= 0) {
                clearInterval(timeInterval);
            }
        }
    }

    setClock('.timer', deadline);

    // Modal

    const modalTrigger = document.querySelectorAll('[data-modal]'),
        modal = document.querySelector('.modal');

    modalTrigger.forEach(btn => {
        btn.addEventListener('click', openModal);
    });

    function closeModal() {
        modal.classList.add('hide');
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    function openModal() {
        modal.classList.add('show');
        modal.classList.remove('hide');
        document.body.style.overflow = 'hidden';
        clearInterval(modalTimerId);
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.getAttribute('data-close') == "") {
            closeModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.code === "Escape" && modal.classList.contains('show')) { 
            closeModal();
        }
    });

    const modalTimerId = setTimeout(openModal, 300000);
    // Изменил значение, чтобы не отвлекало

    function showModalByScroll() {
        if (window.pageYOffset + document.documentElement.clientHeight >= document.documentElement.scrollHeight) {
            openModal();
            window.removeEventListener('scroll', showModalByScroll);
        }
    }
    window.addEventListener('scroll', showModalByScroll);

    // Используем классы для создание карточек меню

    class MenuCard {
        constructor(src, alt, title, descr, price, parentSelector, ...classes) {
            this.src = src;
            this.alt = alt;
            this.title = title;
            this.descr = descr;
            this.price = price;
            this.classes = classes;
            this.parent = document.querySelector(parentSelector);
            this.transfer = 27;
            this.changeToUAH(); 
        }

        changeToUAH() {
            this.price = this.price * this.transfer; 
        }

        render() {
            const element = document.createElement('div');

            if (this.classes.length === 0) {
                this.classes = "menu__item";
                element.classList.add(this.classes);
            } else {
                this.classes.forEach(className => element.classList.add(className));
            }

            element.innerHTML = `
                <img src=${this.src} alt=${this.alt}>
                <h3 class="menu__item-subtitle">${this.title}</h3>
                <div class="menu__item-descr">${this.descr}</div>
                <div class="menu__item-divider"></div>
                <div class="menu__item-price">
                    <div class="menu__item-cost">Цена:</div>
                    <div class="menu__item-total"><span>${this.price}</span> грн/день</div>
                </div>
            `;
            this.parent.append(element);
        }
    }

    getResource('http://localhost:3000/menu')
        .then(data => {
            data.forEach(({img, altimg, title, descr, price}) => {
                new MenuCard(img, altimg, title, descr, price, ".menu .container").render();
            });
        });

    // Forms

    const forms = document.querySelectorAll('form');
    const message = {
        loading: 'img/form/spinner.svg',
        success: 'Спасибо! Скоро мы с вами свяжемся',
        failure: 'Что-то пошло не так...'
    };

    forms.forEach(item => {
        bindPostData(item);
    });

    const postData = async (url, data) => {
        let res = await fetch(url, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: data
        });
    
        return await res.json();
    };

    async function getResource(url) {
        let res = await fetch(url);
    
        if (!res.ok) {
            throw new Error(`Could not fetch ${url}, status: ${res.status}`);
        }
    
        return await res.json();
    }

    function bindPostData(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            let statusMessage = document.createElement('img');
            statusMessage.src = message.loading;
            statusMessage.style.cssText = `
                display: block;
                margin: 0 auto;
            `;
            form.insertAdjacentElement('afterend', statusMessage);
        
            const formData = new FormData(form);

            const json = JSON.stringify(Object.fromEntries(formData.entries()));

            postData('http://localhost:3000/requests', json)
            .then(data => {
                console.log(data);
                showThanksModal(message.success);
                statusMessage.remove();
            }).catch(() => {
                showThanksModal(message.failure);
            }).finally(() => {
                form.reset();
            });
        });
    }

    function showThanksModal(message) {
        const prevModalDialog = document.querySelector('.modal__dialog');

        prevModalDialog.classList.add('hide');
        openModal();

        const thanksModal = document.createElement('div');
        thanksModal.classList.add('modal__dialog');
        thanksModal.innerHTML = `
            <div class="modal__content">
                <div class="modal__close" data-close>×</div>
                <div class="modal__title">${message}</div>
            </div>
        `;
        document.querySelector('.modal').append(thanksModal);
        setTimeout(() => {
            thanksModal.remove();
            prevModalDialog.classList.add('show');
            prevModalDialog.classList.remove('hide');
            closeModal();
        }, 4000);
    }

    // Slider

    let offset = 0;
    let slideIndex = 1;

    const slides = document.querySelectorAll('.offer__slide'),
        slider = document.querySelector('.offer__slider'),
        prev = document.querySelector('.offer__slider-prev'),
        next = document.querySelector('.offer__slider-next'),
        total = document.querySelector('#total'),
        current = document.querySelector('#current'),
        slidesWrapper = document.querySelector('.offer__slider-wrapper'),
        width = window.getComputedStyle(slidesWrapper).width,
        slidesField = document.querySelector('.offer__slider-inner');

    if (slides.length < 10) {
        total.textContent = `0${slides.length}`;
        current.textContent =  `0${slideIndex}`;
    } else {
        total.textContent = slides.length;
        current.textContent =  slideIndex;
    }
    
    slidesField.style.width = 100 * slides.length + '%';
    slidesField.style.display = 'flex';
    slidesField.style.transition = '0.5s all';

    slidesWrapper.style.overflow = 'hidden';

    slides.forEach(slide => {
        slide.style.width = width;
    });

    slider.style.position = 'relative';

    const indicators = document.createElement('ol'),
          dots = [];
    indicators.classList.add('carousel-indicators');
    indicators.style.cssText = `
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: 15;
        display: flex;
        justify-content: center;
        margin-right: 15%;
        margin-left: 15%;
        list-style: none;
    `; // Если хотите - добавьте в стили, но иногда у нас нет доступа к стилям
    slider.append(indicators);

    for (let i = 0; i < slides.length; i++) {
        const dot = document.createElement('li');
        dot.setAttribute('data-slide-to', i + 1);
        dot.style.cssText = `
            box-sizing: content-box;
            flex: 0 1 auto;
            width: 30px;
            height: 6px;
            margin-right: 3px;
            margin-left: 3px;
            cursor: pointer;
            background-color: #fff;
            background-clip: padding-box;
            border-top: 10px solid transparent;
            border-bottom: 10px solid transparent;
            opacity: .5;
            transition: opacity .6s ease;
        `;
        if (i == 0) {
            dot.style.opacity = 1;
        }
        indicators.append(dot);
        dots.push(dot);
    }

    next.addEventListener('click', () => {
        if (offset == (deleteNotDigits(width) * (slides.length - 1))) {
            offset = 0;
        } else {
            offset += deleteNotDigits(width); 
        }

        slidesField.style.transform = `translateX(-${offset}px)`;

        if (slideIndex == slides.length) {
            slideIndex = 1;
        } else {
            slideIndex++;
        }

        if (slides.length < 10) {
            current.textContent =  `0${slideIndex}`;
        } else {
            current.textContent =  slideIndex;
        }

        dots.forEach(dot => dot.style.opacity = ".5");
        dots[slideIndex-1].style.opacity = 1;
    });

    prev.addEventListener('click', () => {
        if (offset == 0) {
            offset = deleteNotDigits(width) * (slides.length - 1);
        } else {
            offset -= deleteNotDigits(width);
        }

        slidesField.style.transform = `translateX(-${offset}px)`;

        if (slideIndex == 1) {
            slideIndex = slides.length;
        } else {
            slideIndex--;
        }

        if (slides.length < 10) {
            current.textContent =  `0${slideIndex}`;
        } else {
            current.textContent =  slideIndex;
        }

        dots.forEach(dot => dot.style.opacity = ".5");
        dots[slideIndex-1].style.opacity = 1;
    });

    dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            const slideTo = e.target.getAttribute('data-slide-to');

            slideIndex = slideTo;
            offset = deleteNotDigits(width) * (slideTo - 1);

            slidesField.style.transform = `translateX(-${offset}px)`;

            if (slides.length < 10) {
                current.textContent =  `0${slideIndex}`;
            } else {
                current.textContent =  slideIndex;
            }

            dots.forEach(dot => dot.style.opacity = ".5");
            dots[slideIndex-1].style.opacity = 1;
        });
    });

    function deleteNotDigits(str) {
        return +str.replace(/\D/g, '');
    }

    // Calculator

    const result = document.querySelector('.calculating__result span');
    
    let sex, height, weight, age, ratio;

    if (localStorage.getItem('sex')) {
        sex = localStorage.getItem('sex');
    } else {
        sex = 'female';
        localStorage.setItem('sex', 'female');
    }

    if (localStorage.getItem('ratio')) {
        ratio = localStorage.getItem('ratio');
    } else {
        ratio = 1.375;
        localStorage.setItem('ratio', 1.375);
    }

    function calcTotal() {
        if (!sex || !height || !weight || !age || !ratio) {
            result.textContent = '____';
            return;
        }
        if (sex === 'female') {
            result.textContent = Math.round((447.6 + (9.2 * weight) + (3.1 * height) - (4.3 * age)) * ratio);
        } else {
            result.textContent = Math.round((88.36 + (13.4 * weight) + (4.8 * height) - (5.7 * age)) * ratio);
        }
    }

    calcTotal();

    function initLocalSettings(selector, activeClass) {
        const elements = document.querySelectorAll(selector);

        elements.forEach(elem => {
            elem.classList.remove(activeClass);
            if (elem.getAttribute('id') === localStorage.getItem('sex')) {
                elem.classList.add(activeClass);
            }
            if (elem.getAttribute('data-ratio') === localStorage.getItem('ratio')) {
                elem.classList.add(activeClass);
            }
        });
    }

    initLocalSettings('#gender div', 'calculating__choose-item_active');
    initLocalSettings('.calculating__choose_big div', 'calculating__choose-item_active');

    function getStaticInformation(selector, activeClass) {
        const elements = document.querySelectorAll(selector);

        elements.forEach(elem => {
            elem.addEventListener('click', (e) => {
                if (e.target.getAttribute('data-ratio')) {
                    ratio = +e.target.getAttribute('data-ratio');
                    localStorage.setItem('ratio', +e.target.getAttribute('data-ratio'));
                } else {
                    sex = e.target.getAttribute('id');
                    localStorage.setItem('sex', e.target.getAttribute('id'));
                }
    
                elements.forEach(elem => {
                    elem.classList.remove(activeClass);
                });
    
                e.target.classList.add(activeClass);
    
                calcTotal();
            });
        });
    }

    getStaticInformation('#gender div', 'calculating__choose-item_active');
    getStaticInformation('.calculating__choose_big div', 'calculating__choose-item_active');

    function getDynamicInformation(selector) {
        const input = document.querySelector(selector);

        input.addEventListener('input', () => {
            if (input.value.match(/\D/g)) {
                input.style.border = "1px solid red";
            } else {
                input.style.border = 'none';
            }
            switch(input.getAttribute('id')) {
                case "height":
                    height = +input.value;
                    break;
                case "weight":
                    weight = +input.value;
                    break;
                case "age":
                    age = +input.value;
                    break;
            }

            calcTotal();
        });
    }

    getDynamicInformation('#height');
    getDynamicInformation('#weight');
    getDynamicInformation('#age');

});
// window.addEventListener("DOMContentLoaded", function () {
//   // Tabs

//   let tabs = document.querySelectorAll(".tabheader__item"),
//     tabsContent = document.querySelectorAll(".tabcontent"),
//     tabsParent = document.querySelector(".tabheader__items");

//   function hideTabContent() {
//     tabsContent.forEach((item) => {
//       item.classList.add("hide");
//       item.classList.remove("show", "fade");
//     });

//     tabs.forEach((item) => {
//       item.classList.remove("tabheader__item_active");
//     });
//   }

//   function showTabContent(i = 0) {
//     tabsContent[i].classList.add("show", "fade");
//     tabsContent[i].classList.remove("hide");
//     tabs[i].classList.add("tabheader__item_active");
//   }

//   hideTabContent();
//   showTabContent();

//   tabsParent.addEventListener("click", function (event) {
//     const target = event.target;
//     if (target && target.classList.contains("tabheader__item")) {
//       tabs.forEach((item, i) => {
//         if (target == item) {
//           hideTabContent();
//           showTabContent(i);
//         }
//       });
//     }
//   });

//   // Timer

//   const deadline = "2022-06-11";

//   function getTimeRemaining(endtime) {
//     const t = Date.parse(endtime) - Date.parse(new Date()),
//       days = Math.floor(t / (1000 * 60 * 60 * 24)),
//       seconds = Math.floor((t / 1000) % 60),
//       minutes = Math.floor((t / 1000 / 60) % 60),
//       hours = Math.floor((t / (1000 * 60 * 60)) % 24);

//     return {
//       total: t,
//       days: days,
//       hours: hours,
//       minutes: minutes,
//       seconds: seconds,
//     };
//   }

//   function getZero(num) {
//     if (num >= 0 && num < 10) {
//       return "0" + num;
//     } else {
//       return num;
//     }
//   }

//   function setClock(selector, endtime) {
//     const timer = document.querySelector(selector),
//       days = timer.querySelector("#days"),
//       hours = timer.querySelector("#hours"),
//       minutes = timer.querySelector("#minutes"),
//       seconds = timer.querySelector("#seconds"),
//       timeInterval = setInterval(updateClock, 1000);

//     updateClock();

//     function updateClock() {
//       const t = getTimeRemaining(endtime);

//       days.innerHTML = getZero(t.days);
//       hours.innerHTML = getZero(t.hours);
//       minutes.innerHTML = getZero(t.minutes);
//       seconds.innerHTML = getZero(t.seconds);

//       if (t.total <= 0) {
//         clearInterval(timeInterval);
//       }
//     }
//   }

//   setClock(".timer", deadline);

//   // Modal

//   const modalTrigger = document.querySelectorAll("[data-modal]"),
//     modal = document.querySelector(".modal");

//   modalTrigger.forEach((btn) => {
//     btn.addEventListener("click", openModal);
//   });

//   function closeModal() {
//     modal.classList.add("hide");
//     modal.classList.remove("show");
//     document.body.style.overflow = "";
//   }

//   function openModal() {
//     modal.classList.add("show");
//     modal.classList.remove("hide");
//     document.body.style.overflow = "hidden";
//     clearInterval(modalTimerId);
//   }

//   modal.addEventListener("click", (e) => {
//     if (e.target === modal || e.target.getAttribute("data-close") == "") {
//       // тут на одинаковые модальные окна применили
//       // делегирование,которое срабатывает по условию если у нас есть атрибут который мы навесили на два модальных окна
//       closeModal();
//     }
//   });

//   document.addEventListener("keydown", (e) => {
//     if (e.code === "Escape" && modal.classList.contains("show")) {
//       closeModal();
//     }
//   });

//   const modalTimerId = setTimeout(openModal, 300000);
//   // Изменил значение, чтобы не отвлекало

//   function showModalByScroll() {
//     if (
//       window.pageYOffset + document.documentElement.clientHeight >=
//       document.documentElement.scrollHeight
//     ) {
//       openModal();
//       window.removeEventListener("scroll", showModalByScroll);
//     }
//   }
//   window.addEventListener("scroll", showModalByScroll);

//   // Используем классы для создание карточек меню

//   class MenuCard {
//     constructor(src, alt, title, descr, price, parentSelector, ...classes) {
//       this.src = src;
//       this.alt = alt;
//       this.title = title;
//       this.descr = descr;
//       this.price = price;
//       this.classes = classes; // добавляет класс к элементу
//       this.parent = document.querySelector(parentSelector);
//       this.transfer = 27;
//       this.changeToUAH();
//     }

//     changeToUAH() {
//       this.price = this.price * this.transfer;
//     }

//     render() {
//       const element = document.createElement("div");

//       if (this.classes.length === 0) {
//         this.classes = "menu__item";
//         element.classList.add(this.classes);
//       } else {
//         this.classes.forEach((className) => element.classList.add(className));
//       }

//       element.innerHTML = `
//                 <img src=${this.src} alt=${this.alt}>
//                 <h3 class="menu__item-subtitle">${this.title}</h3>
//                 <div class="menu__item-descr">${this.descr}</div>
//                 <div class="menu__item-divider"></div>
//                 <div class="menu__item-price">
//                     <div class="menu__item-cost">Цена:</div>
//                     <div class="menu__item-total"><span>${this.price}</span> грн/день</div>
//                 </div>
//             `;
//       this.parent.append(element);
//     }
//   }

//   const getResource = async (url, data) => {
//     // async исп в начале работы функции
//     //это асинхронный код и мы не знаем когда он даст ответ
//     const res = await fetch(url); // fetch если сталкивается с ошибкой как 404 и тд то он не выдает ошибку, то есть реджект не сработает

//     if (!res.ok) {
//       throw new Error(`Could not fetch  ${url} , status ${res.status}`);
//     }
//     return await res.json();
//   };
//   // getResource('http://localhost:3000/menu')
//   // .then(data => {  // достает с объекта эти значения
//   //     data.forEach(({img, altimg, title, descr, price}) => {
//   //         new MenuCard(img, altimg, title, descr, price, ".menu .container").render(); // будет создаваться каждый раз когда приходит ответ с сервера
//   //     });
//   // });
//   axios.get("http://localhost:3000/menu").then((data) =>
//     data.forEach(({ img, altimg, title, descr, price }) => {
//       new MenuCard(
//         img,
//         altimg,
//         title,
//         descr,
//         price,
//         ".menu .container"
//       ).render(); // будет создаваться каждый раз когда приходит ответ с сервера
//     })
//   ); //замена фетча
//   // // Forms

//   const forms = document.querySelectorAll("form");
//   const message = {
//     loading: "./img/spinner.svg",
//     success: "Спасибо! Скоро мы с вами свяжемся",
//     failure: "Что-то пошло не так...",
//   };

//   forms.forEach((item) => {
//     BindpostData(item);
//   });
//   const postData = async (url, data) => {
//     let res = await fetch(url, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: data,
//     });

//     return await res.json();
//   };
//   // const postData = async (url, data) => {
//   //   //это асинхронный код и мы не знаем когда он даст ответ
//   //   const res = await fetch(url, {
//   //     // эта функция получает какую-то инфу от юзера, настраивает запрос и переобразует все в джсон
//   //     method: "POST", // await пропустит работу дальше когда завершится фетч запрос
//   //     headers: {
//   //       "Content-type": "application/json",
//   //     },
//   //     body: data,
//   //   });

//   //   return await res.json();
//   // };
//   // нпкс и формдата
//   function BindpostData(form) {
//     form.addEventListener("submit", (e) => {
//       e.preventDefault();

//       let statusMessage = document.createElement("img"); // создаем атрибут
//       statusMessage.src = message.loading; // в срс вписываем линку с объекта
//       statusMessage.style.cssText = `
//                 display: block;
//                 margin: 0 auto;
//             `; //лучше создать цсс класс и добавлять сюда его
//       form.insertAdjacentElement("afterend", statusMessage); // вместо аппенда, в начале указываем куда мы хотим поставить(после формы) и что мы хотим

//       // это пример формирования
//       //       fetch('https://jsonplaceholder.typicode.com/posts', {
//       //     method: 'POST',
//       //     body: JSON.stringify({name: "ALEX"}),
//       //     headers: {
//       //         'Content-type': 'application/json'
//       //     }
//       // })
//       //       .then(response => response.json())
//       //       .then(json => console.log(json))

//       // request.setRequestHeader(
//       //   "Content-type",
//       //   "application/json; charset=utf-8"
//       // );
//       const formData = new FormData(form); // собираем все данные с помощью формдата из формы

//       const json = JSON.stringify(Object.fromEntries(formData.entries()));

//       // const obj = {a: 23, b: 50}
//       // console.log(Object.entries(obj)) // превращает объект в массив массивов
//       // const object = {};
//       // formData.forEach(function (value, key) {
//       //   object[key] = value;
//       // });

//       // fetch("./index.php", {
//       //   //куда
//       //   method: "POST", // каким образом
//       //   // headers: {
//       //   //   'Content-type': 'application/json'  // что именно
//       //   // },
//       //   body: formData, // в боди у нас формируется запрос, в нем мы пишем что именно хотим отправить, можно например свой объект вставить

//       // })
//       postData("http://localhost:3000/requests", JSON.stringify(json)) //жэсон сервер позволяет работать с джсон файлами
//         .then((data) => {
//           // тут я формирую в джсон инфу которая нам прилетает от юзера, в рикветсы в дбджсон прилетает инфа от юзера
//           console.log(data);
//           showThanksModal(message.success);
//           statusMessage.remove();
//           form.reset();
//         })
//         .catch(() => {
//           showThanksModal(message.failure);
//         })
//         .finally(() => {
//           form.reset();
//         });
//     });
//   }

//   function showThanksModal(message) {
//     const prevModalDialog = document.querySelector(".modal__dialog");

//     prevModalDialog.classList.add("hide");
//     openModal();

//     const thanksModal = document.createElement("div");
//     thanksModal.classList.add("modal__dialog");
//     thanksModal.innerHTML = `
//             <div class="modal__content">
//                 <div class="modal__close" data-close>×</div>
//                 <div class="modal__title">${message}</div>
//             </div>
//         `;
//     document.querySelector(".modal").append(thanksModal);
//     setTimeout(() => {
//       thanksModal.remove();
//       prevModalDialog.classList.add("show");
//       prevModalDialog.classList.remove("hide");
//       closeModal();
//     }, 4000);
//   }
//   // npx нам в какой-то степени зменяет run для запуска файлов
//   fetch("  http://localhost:3000/menu") // ссылка с запушенного джсон сервера  npx json-server db.json
//     .then((data) => data.json())
//     .then((res) => console.log(res));

//   // slider

//   const slides = document.querySelectorAll(".offer__slide"),
//     prev = document.querySelector(".offer__slider-prev"),
//     next = document.querySelector(".offer__slider-next");

//   let slideindex = 1;
//   showSlides(slideindex);
//   function showSlides(n) {
//     if (n > slides.length) {
//       // если Н больше чем количество слайдов, мы ухожим в право
//       slideindex = 1;
//     }

//     if (n < 1) {
//       // перемещаемся в конец, уходим влево
//       slideindex = slideindex.length;
//     }

//     slides.forEach((item) => (item.style.display = "none"));

//     slides[slideindex - 1].style.display = "block";
//   }

//   function plusSlides(n) {
//     showSlides((slideindex += n));
//   }

//   prev.addEventListener("click", () => {
//     plusSlides(-1);
//   });

//   next.addEventListener("click", () => {
//     plusSlides(1);
//   });
// });
