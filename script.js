const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: `Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1Yjg1NWM0ZGUwZDg3MzYxOTkzZjczYmVlNWIzMGMzNiIsIm5iZiI6MTcyOTUzMTcxNC42NzcyOSwic3ViIjoiNjcxMGYwZDYxZjlkMGVlNGI4YzllYTMwIiwic2NvcGVzIjpbImFwaV9yZWFkIl0sInZlcnNpb24iOjF9.B-0Ue9v9UQ4kbigfTjXip-bf_QEs65E-Dm1yhe6o6Gg`
  }
}

const BASE_URL = 'https://api.themoviedb.org/3'
const POSTER_URL = "https://image.tmdb.org/t/p/w500/"

const updatedMoviesDB = JSON.parse(localStorage.getItem('updatedDB'))
const moviesDB = JSON.parse(localStorage.getItem('db'))

const listElement = document.querySelector('.movies-list')
const selectElement = document.querySelector('[name = "pages"]')
const objectElement = document.querySelector('.svg-object')
const paginationElement = document.querySelector('.pagination')
const proggressElement = document.querySelector('.task-progress')
const proggressDivElement = document.querySelector('.progress-bar')
const percentagepProgressElement = document.querySelector('.percentage-progress')
const labelElement = document.querySelector('.input-label')

const numberOfItems = 100
let numberOfPages = Math.ceil(updatedMoviesDB?.length / numberOfItems)

const countriesForMap = {}

if(updatedMoviesDB) {
    setOptions()
    showMovies(updatedMoviesDB, 1, numberOfItems)
    labelElement.innerHTML = `Оновити файл`
}
else {
    objectElement.classList.toggle('visually-hidden')
    paginationElement.classList.toggle('visually-hidden')
}

document.querySelector('.previous-btn-pagination').addEventListener('click', (e) => {
    if (selectElement.selectedIndex === 0) {
        return
    }

    selectElement.selectedIndex = +selectElement.selectedIndex - 1
    selectElement.dispatchEvent(new Event('change'))
})

document.querySelector('.next-btn-pagination').addEventListener('click', (e) => {
    if (selectElement.selectedIndex === numberOfPages - 1) {
        return
    }

    selectElement.selectedIndex = +selectElement.selectedIndex + 1
    selectElement.dispatchEvent(new Event('change'))
})

document.querySelector('[name = "pages"]').addEventListener('change', (e) => {
    let numberOfPage = e.target.value

    showMovies(updatedMoviesDB, numberOfPage, numberOfItems)
})

function setOptions() {
    for (let i = 0; i < numberOfPages; i++) {
        let optionItem = `
            <option value="${i + 1}">${i + 1}</option>
        `
        selectElement.insertAdjacentHTML('beforeend', optionItem)
    }
}

async function getMovieByIMDBsId(url, opt, IMDBsId) {
    let urlWithId = url + `/find/${IMDBsId}?external_source=imdb_id&language=uk`

    try {
        const response = await fetch(urlWithId, opt)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json()
        return data;

    } catch (error) {
        console.error('Fetch error:', error)
    }
}

async function getMovieByTMDBId(url, opt, TMDBid) {
    let urlWithId = url + `/movie/${TMDBid}`

    try {
        const response = await fetch(urlWithId, opt)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        return data;

    } catch (error) {
        console.error('Fetch error:', error)
    }
}

async function setOtherData() {
    const db = JSON.parse(localStorage.getItem('db'))
    let arrayForMovies = []

    proggressDivElement.classList.toggle('visually-hidden')

    for (let i = 0; i < db.length; i++) {

        await getMovieByIMDBsId(BASE_URL, options, db[i].Const)
        .then(({movie_results, tv_results}) => {
            const movieId = movie_results[0]?.id ?? tv_results[0]?.id ?? null

            getMovieByTMDBId(BASE_URL, options, movieId)
            .then(response => {
                console.log(i + 1, response?.title ?? null)

                db[i]['Original Country'] = response?.origin_country ?? null
                db[i]['Poster Path'] = response?.poster_path ?? null

                arrayForMovies.push(db[i])

                proggressElement.value = arrayForMovies.length
                percentagepProgressElement.innerHTML = `${((arrayForMovies.length / db.length) * 100).toFixed(2)} %`
            })
        })
    }

    setTimeout(() => {
        localStorage.setItem('updatedDB', JSON.stringify(arrayForMovies))
        proggressDivElement.classList.toggle('visually-hidden')
        document.location.reload();
    }, 1000)
    
}

document.getElementById('file').addEventListener('change', (e) => {
    objectElement.classList.toggle('visually-hidden')
    paginationElement.classList.toggle('visually-hidden')
    listElement.classList.toggle('visually-hidden')

    if (e.target.files[0]) {
        Papa.parse(e.target.files[0], {
            eader: true,
            skipEmptyLines: true,
            complete: (results) => {

                let jsonObj = [];
                let headers = results.data[0]
                headers.push('Original Country')
                headers.push('Poster Path')

                for (let i = 1; i < results.data.length; i++) {
                    const data = results.data[i];
                    let obj = {};

                    for (let j = 0; j < results.data[0].length - 1; j++) {
                        obj[headers[j]] = data[j];
                        obj['Original Country'] = null
                        obj['Poster Path'] = null
                    }

                    jsonObj.push(obj);
                }

                localStorage.setItem('db', JSON.stringify(jsonObj))

                proggressElement.max = jsonObj.length

                setOtherData()
            },
            error: function (error) {
                console.error('Error parsing CSV:', error);
            }
        })
    }
})

function showMovies(db, page, item) {
    listElement.innerHTML = ''

    const slicedDB = db.filter((element, index) => {
        return index >= (page - 1) * item && index < ((page - 1) * item) + item
    })

    for (let index = 0; index < slicedDB.length; index++) {
        let movieItem = `
            <li class="movie-item">
                <div>
                    <a href="${slicedDB[index]["URL"]}" target="_blank">
                        <img class="movie-poster" src="${POSTER_URL + (slicedDB[index]["Poster Path"])}" alt="${slicedDB[index]["Title"]}" >
                    </a>
                </div>
                <div class="movie-info">
                    <div class="rate-info">
                        <span class="movie-rate">Оцінений: 
                            <time datetime="${slicedDB[index]["Date Rated"]}">${slicedDB[index]["Date Rated"]}</time>
                        </span>
                    </div>
                    <div class="title-info">
                        <h2 class="movie-title">${(index + 1 + ((page - 1) * item))}. ${slicedDB[index]["Title"]} (${slicedDB[index]["Original Title"]})</h2>
                    </div>
                    <div class="additional-info">
                        <span class="year-info">${slicedDB[index]["Year"]} рік</span>
                        <span class="runtime-info">${slicedDB[index]["Runtime (mins)"]} хв</span>
                        <span class="title-type-info">${slicedDB[index]["Title Type"]}</span>
                    </div>
                    <div class="ratings-info">
                        <span class="rating-info">
                            <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" class="imdb-rating-icon" viewBox="0 0 24 24" fill="currentColor" role="presentation">
                                <path d="M12 20.1l5.82 3.682c1.066.675 2.37-.322 2.09-1.584l-1.543-6.926 5.146-4.667c.94-.85.435-2.465-.799-2.567l-6.773-.602L13.29.89a1.38 1.38 0 0 0-2.581 0l-2.65 6.53-6.774.602C.052 8.126-.453 9.74.486 10.59l5.147 4.666-1.542 6.926c-.28 1.262 1.023 2.26 2.09 1.585L12 20.099z"></path>
                            </svg>
                            <span>${slicedDB[index]["IMDb Rating"]} (${slicedDB[index]["Num Votes"]})</span>
                        </span>
                        <span class="rating-info">
                            <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" class="user-rating-icon" viewBox="0 0 24 24" fill="currentColor" role="presentation">
                                <path d="M12 20.1l5.82 3.682c1.066.675 2.37-.322 2.09-1.584l-1.543-6.926 5.146-4.667c.94-.85.435-2.465-.799-2.567l-6.773-.602L13.29.89a1.38 1.38 0 0 0-2.581 0l-2.65 6.53-6.774.602C.052 8.126-.453 9.74.486 10.59l5.147 4.666-1.542 6.926c-.28 1.262 1.023 2.26 2.09 1.585L12 20.099z"></path>
                            </svg>
                            <span>${slicedDB[index]["Your Rating"]}</span>
                        </span>
                    </div>
                </div>
            </li>
        `
        
        listElement.insertAdjacentHTML('beforeend', movieItem)
    }
}

if (updatedMoviesDB) {
    countCountries()

    document.addEventListener("DOMContentLoaded", function () {
        objectElement.addEventListener("load", function () {
            const svgDoc = objectElement.contentDocument
            const svgElement = svgDoc.querySelector("svg")
            const svgPathes = svgElement.querySelectorAll("path")
            const tooltip = document.querySelector('.tooltip')

            svgPathes.forEach(path => {
                if (Boolean(countriesForMap[path.getAttribute("id")])) {
                    path.style.fill = 'red'
                    path.style.stroke = 'white'
                }
            })

            svgPathes.forEach(path => {
                path.addEventListener('mouseenter', (event) => {
                    let amounOfMovies = countriesForMap[path.id]
                    if (path.id === "RU") {
                        amounOfMovies += countriesForMap['SU']
                    }
                    if (amounOfMovies === undefined) {
                        amounOfMovies = 0
                    }
                    tooltip.textContent = `${path.getAttribute("title")}: ${amounOfMovies} movies `
                    tooltip.style.display = 'block'

                    // Установка позиции подсказки
                    tooltip.style.left = event.screenX - 100 + 'px'
                    tooltip.style.top = event.screenY - 75 + 'px'
                })

                path.addEventListener('mousemove', (event) => {
                    // Установка позиции подсказки
                    tooltip.style.left = event.screenX - 100 + 'px'
                    tooltip.style.top = event.screenY - 75 + 'px'
                })

                path.addEventListener('mouseleave', () => {
                    tooltip.style.display = 'none'
                })
            })
        })
    })
}

function countCountries() {
    updatedMoviesDB.forEach((element, index) => {

        if (element['Original Country']?.length > 1) {
            element['Original Country'].forEach((element, index) => {

                if (countriesForMap[element] === undefined) {
                    countriesForMap[element] = 1
                }
                else {
                    countriesForMap[element] += 1
                }
            });
        }
        else {
            if (countriesForMap[element['Original Country']] === undefined) {
                countriesForMap[element['Original Country']] = 1
            }
            else {
                countriesForMap[element['Original Country']] += 1
            }
        }
    })
}