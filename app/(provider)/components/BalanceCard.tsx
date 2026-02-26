import { View, Text, Image } from "react-native";
import React, { useContext } from "react";
import { AuthContext } from "@/app/context/AppContext";

const BalanceCard = ({
  user_name,
  tier,
}: {
  user_name: string;
  tier: string;
}) => {
  const authState = useContext(AuthContext);
  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <View>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>
            Welcme, {user_name}
          </Text>
          <View
            style={{
              backgroundColor: "white",
              width: 100,
              paddingLeft: 2,
              justifyContent: "center",
              borderRadius: 10,
              paddingHorizontal: 5,
              paddingVertical: 2,
              boxShadow: "0px 0px 1px 0px grey",
            }}
          >
            <Text
              style={{
                marginTop: 4,
                color: "#2563EB",
                fontWeight: "500",
              }}
            >
              {tier}
            </Text>
          </View>
        </View>
        <Image
          source={require("../../../assets/images/android-icon-foreground.png")}
          style={{ width: 50, height: 50, borderRadius: 25 }}
        />
      </View>
    </View>
  );
};

export default BalanceCard;
