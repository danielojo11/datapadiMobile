import { View, Text } from "react-native";
import React, { useContext } from "react";
import { Redirect, Stack } from "expo-router";
import { AuthContext } from "../context/AppContext";

const _layout = () => {
  const authState = useContext(AuthContext);
  if (!authState.isReady) {
    return null;
  }
  if (!authState.isAuthenticated) {
    return <Redirect href={"/login"} />;
  }

  return (
    <Stack>
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          animation: "simple_push",
        }}
      />
    </Stack>
  );
};

export default _layout;
