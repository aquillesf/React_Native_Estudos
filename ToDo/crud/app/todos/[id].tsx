import { Text, View, TextInput, Pressable, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { data } from "@/data/todos"
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter, useLocalSearchParams } from "expo-router";


export default function Index(){

    const [todos, setTodos] = useState(data.sort((a,b) => b.id - a.id));
    const { id } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTodos = async () => {
        try {
            const jsonValue = await AsyncStorage.getItem("@todos");
            if (jsonValue) {
            setTodos(JSON.parse(jsonValue));
            }
        } catch (error) {
            console.error("Erro ao carregar dados", error);
        } finally {
            setLoading(false);
        }
        };
        loadTodos();
    }, []);

    if (!id) {
        return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>ID da tarefa não informado</Text>
        </SafeAreaView>
        );
    }

    const selectedTodo = todos.find((t) => t.id === Number(id));


    if (!selectedTodo) {
        return (
            <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Tarefa não encontrada</Text>
            </SafeAreaView>
        );
    }
    
    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
            options={{
            title: `Tarefa #${selectedTodo.id}`, 
            headerStyle: { backgroundColor: 'black' },
            headerTintColor: 'white',
                }}
            />
            <Text style={styles.title}>Detalhes da Tarefa</Text>
            <Text style={styles.todoText}>ID: {selectedTodo.id}</Text>
            <Text style={styles.todoText}>Texto: {selectedTodo.title}</Text>
            <Text style={styles.todoText}>
                Status: {selectedTodo.completed ? "Concluída" : "Pendente"}
            </Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "white",
  },
  todoText: {
    fontSize: 18,
    color: "white",
    marginBottom: 10,
  },
});
