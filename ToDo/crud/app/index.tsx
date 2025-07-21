import { Text, View, TextInput, Pressable, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { data } from "@/data/todos"
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter, useLocalSearchParams } from "expo-router";


export default function Index() {
  const [todos, setTodos] = useState(data.sort((a,b) => b.id - a.id));
  const[text, setText] = useState("");


  useEffect(() => {
    const loadTodos = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('@todos');
        if (jsonValue != null) {
          setTodos(JSON.parse(jsonValue));
        }
      } catch (e) {
        console.error("Erro ao carregar dados", e);
      }
    };

    loadTodos();
  }, []);

  useEffect(() => {
    const saveTodos = async () => {
      try {
        const jsonValue = JSON.stringify(todos);
        await AsyncStorage.setItem('@todos', jsonValue);
      } catch (e) {
        console.error("Erro ao salvar dados", e);
      }
    };

    saveTodos();
  }, [todos]);

  //ADD
  const addTodo = () => {
    if (text.trim()) {
      const newId = todos.length > 0 ? todos[0].id + 1 : 1;
      setTodos([{ id: newId, title: text, completed: false}, ...todos]);
      setText("");
    }
  }

  //READ
  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  }

  const handlePress = (id: number) => {
    const router = useRouter();
    router.push({
      pathname: '/todos/[id]',
      params: { id: id.toString() },
    });
  }

  //DELETE
  const removeTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  }

  const renderItem = ({ item }: { item: { id: number; title: string; completed: boolean } }) => (
    <View style={styles.todoItem}>
      <Text
        style={[styles.todoText, item.completed && styles.completedText]}
        onPress ={() => handlePress(item.id)}
        onLongPress={() => toggleTodo(item.id)}
      >
        {item.title}
      </Text>
      <Pressable onPress={() => removeTodo(item.id)}>
        <MaterialCommunityIcons name="delete-circle" size={36} color="red" selectable={undefined} />
      </Pressable>
    </View>
  )


  return (
    <SafeAreaView style={ styles.container }>
      <View style={ styles.inputContainer }>
        <TextInput 
          style={ styles.input }
          placeholder="Add a new todo"
          placeholderTextColor= "gray"
          value = { text }
          onChangeText = { setText }

        />
        <Pressable onPress={ addTodo } style={ styles.addButton }>
          <Text style={ styles.addButtonText }>
            Add
          </Text>
        </Pressable>
      </View>
      <FlatList
        data={todos}
        renderItem={renderItem}
        keyExtractor={(todo) => todo.id.toString()}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 40,
    backgroundColor: 'black',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    color: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#0a84ff',
    marginLeft: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

  todoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  todoText: {
    color: 'white',
    fontSize: 16,
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },

});
