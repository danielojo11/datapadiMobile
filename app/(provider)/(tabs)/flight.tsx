import { View, Text } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

const Flight = () => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: '50%' }}>

                <Ionicons name='airplane-outline' size={48} color='#000' />
                <Text style={{ fontSize: 30, fontWeight: 'bold', textAlign: 'center', marginTop: '50%', color: '#000' }}>Coming Soon...</Text>
            </View>
        </SafeAreaView>
    )
}

const styles = {
    safeArea: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
}

export default Flight