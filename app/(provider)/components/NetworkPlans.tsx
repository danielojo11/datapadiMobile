// import { View, Text, TouchableOpacity } from "react-native";
// import React from "react";

// const NetworkPlans = ({ key }) => {
//   return (
//     <TouchableOpacity
//       key={key}
//       style={styles.planCard}
//       onPress={() => {
//         setSelectedPlan(plan);
//         setStep("enterPhone");
//       }}
//     >
//       <View>
//         <Text style={styles.planName}>{plan.name}</Text>
//         <Text style={styles.planSub}>{plan.validity}</Text>
//       </View>
//       <Text style={styles.planPrice}>
//         {plan.price} {"›"}
//       </Text>
//     </TouchableOpacity>
//   );
// };

// const styles = StyleSheet.create({
//   planCard: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: 15,
//     borderWidth: 1,
//     borderColor: "#EEE",
//     borderRadius: 12,
//     marginBottom: 10,
//   },
//   planName: { fontWeight: "700", fontSize: 15 },
//   planSub: { color: "#999", fontSize: 12 },
//   planPrice: { color: "#003366", fontWeight: "700" },
//   summaryBox: {
//     backgroundColor: "#F0F7FF",
//     padding: 15,
//     borderRadius: 10,
//     marginBottom: 20,
//   },
// });

// export default NetworkPlans;

import { View, Text } from "react-native";
import React from "react";

const NetworkPlans = () => {
  return (
    <View>
      <Text>NetworkPlans</Text>
    </View>
  );
};

export default NetworkPlans;
