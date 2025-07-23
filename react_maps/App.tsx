import 'react-native-get-random-values'; 
import { polyfillWebCrypto } from 'expo-standard-web-crypto';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity} from 'react-native';
import MapView, { LatLng, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { GooglePlaceDetail, GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_API_KEY } from './enviroments';
import Constants from 'expo-constants';
import React, { useState, useRef } from 'react';
import 'react-native-url-polyfill/auto';
import MapViewDirections from 'react-native-maps-directions';

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.02;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const INITIAL_POSITION = {

  latitude: 40.76711,
  longitude: -73.979704, 
  latitudeDelta: LATITUDE_DELTA,
  longitudeDelta: LONGITUDE_DELTA,
};

type InputAutocompleteProps = {
  label: string;
  placeholder?: string;
  onPlaceSelected: (details: GooglePlaceDetail | null) => void;
};

function InputAutocomplete({
  label,
  placeholder,
  onPlaceSelected,
}: InputAutocompleteProps) {
  return (
    <>
      <Text>{label}</Text>
      <GooglePlacesAutocomplete
        keyboardShouldPersistTaps="handled"
        debounce={200}
        timeout={20000}
        minLength={3}
        predefinedPlaces={[]}
        nearbyPlacesAPI='GooglePlacesSearch'
        predefinedPlacesAlwaysVisible={false}
        textInputProps={{ autoCapitalize: 'none' }}  
        onFail={error => console.error(error)}
        listViewDisplayed="auto"
        styles={{ textInput: styles.input }}
        placeholder={placeholder || "Search for a place..."}
        fetchDetails={true}
        onPress={(data, details = null) => {
          onPlaceSelected(details);
        }}
        query={{
          key: GOOGLE_API_KEY,
          language: 'pt-BR',
        }}
      />
    </>
  );
}




export default function App() {

  const [origin, setOrigin] = useState<LatLng | null>()
  const [destination, setDestination] = useState<LatLng | null>();
  const [showDirections, setShowDirections] = useState(false)
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const mapRef = useRef<MapView>(null)
  

  const moveTo = async (position: LatLng) => {
    const camera = await mapRef.current?.getCamera();
    if (camera) {
      camera.center = position;
      mapRef.current?.animateCamera(camera, { duration: 1000 });
    }
  };

  const edgePaddingValue = 70;

  const edgePadding = {
    top: edgePaddingValue,
    right: edgePaddingValue,
    bottom: edgePaddingValue,
    left: edgePaddingValue,
  };

  const traceRouteOnReady = (args: any) => {
    if (args) {
      // args.distance
      // args.duration
      setDistance(args.distance);
      setDuration(args.duration);
    }
  };

  const traceRoute = () => {
    if (origin && destination) {
      setShowDirections(true);
      mapRef.current?.fitToCoordinates([origin, destination], { edgePadding });
    }
  };

  const onPlaceSelected = (details: GooglePlaceDetail | null, flag: "origin" | "destination") => {
    const set = flag === "origin" ? setOrigin : setDestination;
    console.log(flag);
    console.log(set);
    const position= {
      latitude: details?.geometry.location.lat || 0,
      longitude: details?.geometry.location.lng || 0
    }
    set(position)
    moveTo(position);
  };

  return (
    <View style={styles.container}>
      <MapView 
        ref={mapRef}
        style={styles.map} 
        provider={PROVIDER_GOOGLE} 
        initialRegion={INITIAL_POSITION}
      >
        {origin && <Marker coordinate={origin} />}
        {destination && <Marker coordinate={destination} />}
        {showDirections && origin && destination && 
          <MapViewDirections origin={origin} destination={destination} apikey={GOOGLE_API_KEY} 
          strokeColor="#6644ff" strokeWidth={4} onReady={traceRouteOnReady}
        />}

      </MapView>
      <View style={styles.searchContainer}>
        <InputAutocomplete label="Origin" onPlaceSelected={(details) => {onPlaceSelected(details, "origin")}}/>
        <InputAutocomplete label="Destination" onPlaceSelected={(details) => {onPlaceSelected(details, "destination")}}/>
        <TouchableOpacity style ={styles.button} onPress={traceRoute}>
          <Text style ={styles.buttonText}>Trace Route</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  }, 

  searchContainer: {
    position: "absolute",
    width: "90%",
    backgroundColor: "white",
    shadowColor: "black",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    padding: 8,
    borderRadius: 8,
    top: Constants.statusBarHeight,
    zIndex: 999,
    elevation: 999, 
  },

  input: {
    borderColor: "#888",
    borderWidth: 1,
  },

  button: {
    backgroundColor: "#bbb",
    paddingVertical: 12,
    marginTop: 16,
    borderRadius: 4,
  },

  buttonText: {
    textAlign: "center",
  },

});
