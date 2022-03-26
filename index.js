document.addEventListener("DOMContentLoaded", function () {
    var map = L.map('map').setView([48.20849, 16.37208], 12);

    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'pk.eyJ1IjoiamFrb2JwZXIiLCJhIjoiY2wxN3ZjYmZqMTgzcTNvcXp6YTd0dXYwZyJ9.IG2pM_8jQVxb6ohKX9lDzQ'
    }).addTo(map);

});