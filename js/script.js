const SEMESTER_START = new Date("2026-09-01T00:00:00");
const SEMESTER_END = new Date("2027-02-14T23:59:59");
const currentDate = new Date();
const totalDuration = SEMESTER_END - SEMESTER_START;
const elapsedDuration = currentDate - SEMESTER_START;

const semesterPercentage = Math.min(
    100,
    Math.max(0, (elapsedDuration / totalDuration) * 100)
);

const progressBar = document.getElementById("semester-progress");
const progressLabel = document.getElementById("semester-progress-label");

if (progressBar && progressLabel) {
    progressBar.value = semesterPercentage;
    progressLabel.textContent = "Uplynulo " + Math.round(semesterPercentage) + " % semestra.";
}



const currentLessonStatus = document.getElementById("current-lesson-status");

const lessonCells = document.querySelectorAll(
    "tbody td[data-day][data-start][data-end]"
);

if (currentLessonStatus && lessonCells.length > 0) {
    const now = new Date();
    const currentDay = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let activeLesson = null;

    lessonCells.forEach(function (cell) {
        cell.classList.remove("current-lesson");

        const startParts = cell.dataset.start.split(":");
        const endParts = cell.dataset.end.split(":");

        const startMinutes =
            Number(startParts[0]) * 60 + Number(startParts[1]);

        const endMinutes =
            Number(endParts[0]) * 60 + Number(endParts[1]);

        if (
            Number(cell.dataset.day) === currentDay &&
            currentMinutes >= startMinutes &&
            currentMinutes < endMinutes
        ) {
            activeLesson = cell;
            cell.classList.add("current-lesson");
        }
    });

    if (activeLesson) {
        currentLessonStatus.textContent =
            "Práve prebieha hodina: " +
            activeLesson.textContent.trim() +
            " (" +
            activeLesson.dataset.start +
            " – " +
            activeLesson.dataset.end +
            ").";
    } else {
        let nextLesson = null;

        lessonCells.forEach(function (cell) {
            const startParts = cell.dataset.start.split(":");

            const startMinutes =
                Number(startParts[0]) * 60 + Number(startParts[1]);

            const dayDifference =
                (Number(cell.dataset.day) - currentDay + 7) % 7;

            let difference =
                dayDifference * 24 * 60 + startMinutes - currentMinutes;

            if (difference <= 0) {
                difference += 7 * 24 * 60;
            }

            if (!nextLesson || difference < nextLesson.difference) {
                nextLesson = {
                    cell: cell,
                    difference: difference
                };
            }
        });

        const dayNames = [
            "v nedeľu",
            "v pondelok",
            "v utorok",
            "v stredu",
            "vo štvrtok",
            "v piatok",
            "v sobotu"
        ];

        if (nextLesson) {
            currentLessonStatus.textContent =
                "Momentálne neprebieha žiadna hodina. " +
                "Najbližšia hodina je " +
                dayNames[Number(nextLesson.cell.dataset.day)] +
                " o " +
                nextLesson.cell.dataset.start +
                ".";
        } else {
            currentLessonStatus.textContent =
                "Momentálne nie je naplánovaná žiadna hodina.";
        }
    }
}











const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector("nav ul");

menuToggle.addEventListener("click", function () {
    navMenu.classList.toggle("open");
    menuToggle.textContent = navMenu.classList.contains("open") ? "✕" : "☰";
});










const filterButtons = document.querySelectorAll(".filter-button");
const scheduleCells = document.querySelectorAll("tbody td.lecture, tbody td.exercise, tbody td.physical-education"
);

filterButtons.forEach(function (button) {
     button.addEventListener("click", function () {

         filterButtons.forEach(function (filterButton) {
            filterButton.classList.remove("active");
        });

        button.classList.add("active");

        const selectedFilter = button.dataset.filter;

        scheduleCells.forEach(function (cell) {
            if (
                selectedFilter === "all" ||
                cell.classList.contains(selectedFilter)
            ) {
                cell.style.visibility = "visible";
            } else {
                cell.style.visibility = "hidden";
            }
        });
    });
});














// ========================================
// 1. LEAFLET MAP
// ========================================

const map = L.map("map").setView(
    [48.151965, 17.072995],
    15
);

L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
).addTo(map);


// ========================================
// 2. MARKER
// ========================================

const schoolMarker = L.marker([48.151965, 17.072995])
    .addTo(map)
    .bindPopup("FEI STU Bratislava");

const homeMarker = L.marker([48.0870, 18.1825])
    .addTo(map)
    .bindPopup("Moje bydlisko");

const fixedPoints = {
    school: {
        name: "FEI STU Bratislava",
        latitude: 48.151965,
        longitude: 17.072995,
        marker: schoolMarker
    },
    home: {
        name: "Moje bydlisko",
        latitude: 48.0870,
        longitude: 18.1825,
        marker: homeMarker
    }
};


const mapBounds = L.latLngBounds(
    schoolMarker.getLatLng(),
    homeMarker.getLatLng()
);

map.fitBounds(mapBounds);

// ========================================
// 3. ADD CUSTOM MARKER
// ========================================
const customMarkers = [];
let routeLine = null;

function createCustomMarker(point) {
    const marker = L.marker([
        point.latitude,
        point.longitude
    ])
        .addTo(map)
        .bindPopup(point.name);

    customMarkers.push({
        name: point.name,
        latitude: point.latitude,
        longitude: point.longitude,
        marker: marker
    });

    return marker;
}

map.on("click", function (event) {
    const name = prompt("Zadajte nazov miesta:");

    if (!name) {
        return;
    }

    const point = {
        name: name,
        latitude: event.latlng.lat,
        longitude: event.latlng.lng
    };

    const marker = createCustomMarker(point);

    saveCustomMarkers();
    renderPointList();
    renderPointSelect();

    marker.openPopup();
});

function saveCustomMarkers() {
    const points = customMarkers.map(function (point) {
        return {
            name: point.name,
            latitude: point.latitude,
            longitude: point.longitude
        };
    });

    localStorage.setItem(
        "customMapPoints",
        JSON.stringify(points)
    );
}

function loadCustomMarkers() {
    const savedPoints = localStorage.getItem("customMapPoints");

    if (!savedPoints) {
        return;
    }

    const points = JSON.parse(savedPoints);

    points.forEach(function (point) {
        createCustomMarker(point);
    });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const earthRadius = 6371;

    const latDifference = (lat2 - lat1) * Math.PI / 180;
    const lonDifference = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(latDifference / 2) * Math.sin(latDifference / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(lonDifference / 2) * Math.sin(lonDifference / 2);

    const c = 2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
    );

    return earthRadius * c;
}

function renderPointList() {
    const pointList = document.getElementById("point-list");
    const emptyState = document.getElementById("empty-state");

    pointList.innerHTML = "";

    if (customMarkers.length === 0) {
        emptyState.hidden = false;
        return;
    }

    emptyState.hidden = true;

    customMarkers.forEach(function (point) {
        const listItem = document.createElement("li");
        const button = document.createElement("button");

        button.textContent = point.name;

        button.addEventListener("click", function () {
            map.setView(
                [point.latitude, point.longitude],
                15
            );

            point.marker.openPopup();
        });

        listItem.appendChild(button);
        pointList.appendChild(listItem);
    });
}


function renderPointSelect() {
    const pointSelect = document.getElementById("point-select");

    pointSelect.innerHTML =
        '<option value="">Vyberte bod</option>';

    customMarkers.forEach(function (point, index) {
        const option = document.createElement("option");

        option.value = index;
        option.textContent = point.name;

        pointSelect.appendChild(option);
    });
}

loadCustomMarkers();
renderPointList();
renderPointSelect();



document
    .getElementById("calculate-route")
    .addEventListener("click", function () {
        const pointSelect = document.getElementById("point-select");
        const targetSelect = document.getElementById("target-select");
        const routeResult = document.getElementById("route-result");

        if (pointSelect.value === "") {
            routeResult.textContent =
                "Najprv vyberte bod.";
            return;
        }

        const selectedPoint = customMarkers[
            Number(pointSelect.value)
        ];

        const targetPoint = fixedPoints[targetSelect.value];

        const distance = calculateDistance(
            selectedPoint.latitude,
            selectedPoint.longitude,
            targetPoint.latitude,
            targetPoint.longitude
        );

        routeResult.textContent =
            "Vzdialenosť medzi " +
            selectedPoint.name +
            " a " +
            targetPoint.name +
            ": " +
            distance.toFixed(2) +
            " km";

        if (routeLine) {
            map.removeLayer(routeLine);
        }

        const accentColor = getComputedStyle(document.documentElement)
            .getPropertyValue("--color-background")
            .trim();

        routeLine = L.polyline(
            [
                [
                    selectedPoint.latitude,
                    selectedPoint.longitude
                ],
                [
                    targetPoint.latitude,
                    targetPoint.longitude
                ]
            ],
            {
                color: accentColor,
                weight: 5,
                opacity: 0.9
            }
        ).addTo(map);

        selectedPoint.marker.bindPopup(
            selectedPoint.name +
            "<br>Vzdialenosť: " +
            distance.toFixed(2) +
            " km"
        );

        targetPoint.marker.bindPopup(
            targetPoint.name +
            "<br>Vzdialenosť: " +
            distance.toFixed(2) +
            " km"
        );

        selectedPoint.marker.openPopup();
    });