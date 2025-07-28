import 'react-native-get-random-values'; 
import { StyleSheet, Text, View, Dimensions, TouchableOpacity, Alert} from 'react-native';
import MapView, { LatLng, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { GooglePlaceDetail, GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_API_KEY } from './enviroments';
import Constants from 'expo-constants';
import React, { useState, useRef } from 'react';
import 'react-native-url-polyfill/auto';
import MapViewDirections from 'react-native-maps-directions';
import { useEffect } from 'react';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get("window");

//calculos pra pegar certinho os pontos geograficos dos lugares
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.02;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const INITIAL_POSITION = {
  latitude: -27.5969,
  longitude: -48.5495, 
  latitudeDelta: LATITUDE_DELTA,
  longitudeDelta: LONGITUDE_DELTA,
};

type InputAutocompleteProps = {
  label: string;
  placeholder?: string;
  onPlaceSelected: (details: GooglePlaceDetail | null) => void;
};

//aqui é onde eu puxo as localizações que o usuario escreve na text box e apresento as sugestões dos lugares
//tem um cap de 3 letras q ele precisa digtar para aparecer as "sugestoes" e as querys do google
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

  //localizações
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  //origem e destino que o usario vai colocar
  const [origin, setOrigin] = useState<LatLng | null>()
  const [destination, setDestination] = useState<LatLng | null>();
  //rotas
  const [showDirections, setShowDirections] = useState(false)
  //const [distance, setDistance] = useState(0);
  //const [duration, setDuration] = useState(0);
  //mapa
  const mapRef = useRef<MapView>(null)

  //aqui é pra pegar a localização do usuário quando o app inicia
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Não foi possível acessar sua localização');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const userLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setCurrentLocation(userLocation); 
      moveTo(userLocation);
      
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 2,
        },
        (newLocation) => {
          const updatedLocation = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          };
          setCurrentLocation(updatedLocation);
        }
      );
      
      setLocationSubscription(subscription);
      
    })();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  //aqui é onde a camera do mapa se move para a localização que o usuário selecionou
  const moveTo = async (position: LatLng) => {
    const camera = await mapRef.current?.getCamera();
    if (camera) {
      camera.center = position;
      mapRef.current?.animateCamera(camera, { duration: 1000 });
    }
  };

  //aqui traça as rotas
  //const traceRouteOnReady = (args: any) => {
    //if (args) {
      //args.distance
       //args.duration
       //setDistance(args.distance);
       //setDuration(args.duration);
    //}
  //};

  const traceRoute = () => {
    if (origin && destination) {
      setShowDirections(true);
      mapRef.current?.fitToCoordinates([origin, destination]);
    }

    else if (!origin && destination && currentLocation) {
      setOrigin(currentLocation);
      setShowDirections(true);
      mapRef.current?.fitToCoordinates([currentLocation, destination]);
    }

    else {
    Alert.alert(
      'Rota incompleta', 
      'Por favor, selecione pelo menos um destino ou certifique-se de que sua localização atual está disponível.'
    );
  }};

  const traceRouteFromUserLocationToMarker = () => {
    if (currentLocation) {
      const markerPosition = {latitude: -27.4946, longitude: -48.656};
      setOrigin(currentLocation);
      setDestination(markerPosition);
      setShowDirections(true);
      mapRef.current?.fitToCoordinates([currentLocation, markerPosition]);
    }
  };

  // Verifica se a localização atual é a mesma que a selecionada
  const isUserSelectingCurrentLocation = (details: GooglePlaceDetail) => {
    if (!currentLocation || !details) return false;
    const latDiff = Math.abs(details.geometry.location.lat - currentLocation.latitude);
    const lngDiff = Math.abs(details.geometry.location.lng - currentLocation.longitude);  
    return latDiff < 0.0001 && lngDiff < 0.0001; 
  };

  const onPlaceSelected = (
      details: GooglePlaceDetail | null, 
      flag: "origin" | "destination"
    ) => {
      if (!details) return;

      const position = {
        latitude: details.geometry.location.lat,
        longitude: details.geometry.location.lng,
      };

    const set = flag === "origin" ? setOrigin : setDestination;
    set(position);
    moveTo(position);

    if (flag === "origin" && isUserSelectingCurrentLocation(details)) {
      setOrigin(position); 
    }
  };

  //esse return é onde cai o front depois que o usuario seleciona as coisas e as funções calculam
  //aqui é basicamente o front do mapa
  return (
    <View style={styles.container}>
      <MapView 
        ref={mapRef}
        style={styles.map} 
        provider={PROVIDER_GOOGLE} 
        initialRegion={INITIAL_POSITION}
        showsUserLocation={true}
        followsUserLocation={showDirections}
        showsCompass={true}
      >
        {origin && <Marker coordinate={origin} />}
        {destination && <Marker coordinate={destination} />}
        {showDirections && origin && destination && 
          <MapViewDirections origin={origin} destination={destination} apikey={GOOGLE_API_KEY} 
            strokeColor="#6644ff" strokeWidth={4} //onReady={traceRouteOnReady}
          />}

        <Marker
          coordinate={{latitude: -27.4946, longitude:-48.656}}
          title="Marker Example"
          pinColor="#00cc00"
          onPress={() => traceRouteFromUserLocationToMarker()}
        />
      </MapView>
      <View style={styles.searchContainer}>
        <InputAutocomplete label="Origin" onPlaceSelected={(details) => {onPlaceSelected(details, "origin")}}/>
        <InputAutocomplete label="Destination" onPlaceSelected={(details) => {onPlaceSelected(details, "destination")}}/>
        <TouchableOpacity style ={styles.button} onPress={traceRoute}>
          <Text style ={styles.buttonText}>Trace Route</Text>
        </TouchableOpacity>
        <TouchableOpacity style ={styles.button} onPress={() => {setShowDirections(false); setOrigin(null); setDestination(null);}}>
          <Text style ={styles.buttonText}>Remove Directions</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
};

// css
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

})


