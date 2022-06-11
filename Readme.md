# Are They Real???

## By Jakob Pernsteiner and Elias Kristmann

This project provides an exploratory visualisation for UFO sightings reported to the [National UFO Reporting Center](https://nuforc.org/). The visualisation provied the possibility to view the details of multiple spatial datapoints at the same time by positioning the poups via [Minimum-Displacement Overlap Removal for Geo-referenced Data Visualization](https://onlinelibrary.wiley.com/doi/abs/10.1111/cgf.13199).

The website and its source code can be found [HERE](src).

# Description

TODO:
* Document website, how it works and such
* Add screenshots

# How to run it locally

If you are missing the converted data you need to convert it first, simply run `python convert.py` in the src directory. This can take a minute or two.

To be able to access the website you need to run it on an webserver, else the scripts will not load properly. A simple pyhton one is provided, simply run `python webserver.py` which hosts it at port `8000`.

# Used Libraries

* Map library
  * [Leaflet.js](https://leafletjs.com/)
* Cluster plugin
  * [Leaflet-markercluster](https://leaflet.github.io/Leaflet.markercluster/)
* CSV library
  * https://github.com/okfn/csv.js/