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