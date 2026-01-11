import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    StyleSheet,
    Text,
    Dimensions,
    NativeScrollEvent,
    NativeSyntheticEvent,
    FlatList,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = 8; // Reduced from 10 to fit more numbers
const CENTER_OFFSET = SCREEN_WIDTH / 2;

// Memoized Tick component to prevent unnecessary re-renders
const DialTick = React.memo(({ item, index, isCompact }: { item: number; index: number; isCompact: boolean }) => {
    const isWholeNumber = index % 100 === 0;
    const isTenth = index % 10 === 0 && !isWholeNumber;
    const isHalfTenth = index % 5 === 0 && !isTenth && !isWholeNumber;

    return (
        <View style={[styles.itemContainer, { paddingTop: 12 }]}>
            <View
                style={[
                    styles.tick,
                    isWholeNumber ? styles.majorTick : isTenth ? styles.midTick : styles.minorTick,
                    !isWholeNumber && !isTenth && !isHalfTenth && { height: 8, opacity: 0.3 },
                    isCompact && {
                        height: isWholeNumber ? 40 : isTenth ? 25 : isHalfTenth ? 15 : 8
                    }
                ]}
            />
            {isWholeNumber && (
                <Text style={styles.tickLabel}>{item.toFixed(0)}</Text>
            )}
            {isTenth && !isCompact && (
                <Text style={[styles.tickLabel, { fontSize: 9, marginTop: 4 }]}>
                    .{(index % 100 / 10).toFixed(0)}
                </Text>
            )}
        </View>
    );
});

interface WeightDialProps {
    value: number;
    onValueChange: (value: number) => void;
    min?: number;
    max?: number;
    height?: number;
}

export const WeightDial: React.FC<WeightDialProps> = ({
    value,
    onValueChange,
    min = 0.1,
    max = 1000,
    height = 100,
}) => {
    const flatListRef = useRef<FlatList>(null);
    const isScrolling = useRef(false);
    const lastSyncValue = useRef(value);
    const isCompact = height < 80;

    // Calculate total steps (0.01 increments)
    const steps = useMemo(() => Math.floor((max - min) * 100) + 1, [min, max]);
    const data = useMemo(() => Array.from({ length: steps }, (_, i) => min + i * 0.01), [steps, min]);

    // Sync scroll position with external value changes
    useEffect(() => {
        if (Math.abs(value - lastSyncValue.current) > 0.001 && !isScrolling.current) {
            lastSyncValue.current = value;
            const index = Math.round((value - min) * 100);
            if (index >= 0 && index < steps) {
                flatListRef.current?.scrollToOffset({
                    offset: index * ITEM_WIDTH,
                    animated: true,
                });
            }
        }
    }, [value, min, steps]);

    // Initial scroll position
    useEffect(() => {
        const index = Math.round((value - min) * 100);
        if (index >= 0 && index < steps) {
            setTimeout(() => {
                flatListRef.current?.scrollToOffset({
                    offset: index * ITEM_WIDTH,
                    animated: false,
                });
            }, 100);
        }
    }, []);

    const handleScroll = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            if (!isScrolling.current) return;

            const offset = event.nativeEvent.contentOffset.x;
            const index = Math.round(offset / ITEM_WIDTH);
            const newValue = parseFloat((min + index * 0.01).toFixed(2));

            if (Math.abs(newValue - value) > 0.001 && newValue >= min && newValue <= max) {
                lastSyncValue.current = newValue;
                onValueChange(newValue);
            }
        },
        [onValueChange, min, max, value]
    );

    const renderItem = useCallback(({ item, index }: { item: number; index: number }) => (
        <DialTick item={item} index={index} isCompact={isCompact} />
    ), [isCompact]);

    return (
        <View style={[styles.container, { height, marginVertical: height < 80 ? 5 : 10 }]}>
            <FlatList
                ref={flatListRef}
                data={data}
                renderItem={renderItem}
                keyExtractor={(_, index) => index.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={ITEM_WIDTH}
                decelerationRate="fast"
                onScroll={handleScroll}
                scrollEventThrottle={32} // Increased throttle for performance
                onScrollBeginDrag={() => {
                    isScrolling.current = true;
                }}
                onMomentumScrollEnd={() => {
                    isScrolling.current = false;
                }}
                onScrollEndDrag={(e) => {
                    if (e.nativeEvent.velocity?.x === 0) {
                        isScrolling.current = false;
                    }
                }}
                contentContainerStyle={{
                    paddingHorizontal: CENTER_OFFSET - ITEM_WIDTH / 2,
                }}
                getItemLayout={(_, index) => ({
                    length: ITEM_WIDTH,
                    offset: ITEM_WIDTH * index,
                    index,
                })}
                removeClippedSubviews={true}
                initialNumToRender={20}
                windowSize={3} // Drastically reduced for 100k items
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={50}
            />

            {/* Center Pointer */}
            <View style={[styles.pointerContainer, { paddingTop: 12 }]} pointerEvents="none">
                <View style={[styles.pointer, { height: 45 }]} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: '#ffffff',
        justifyContent: 'center',
    },
    itemContainer: {
        width: ITEM_WIDTH,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    tick: {
        backgroundColor: '#e5e7eb',
        width: 2,
        borderRadius: 1,
    },
    minorTick: {
        height: 15,
    },
    midTick: {
        height: 25,
        backgroundColor: '#9ca3af',
    },
    majorTick: {
        height: 40,
        backgroundColor: '#6366f1',
        width: 3,
    },
    tickLabel: {
        marginTop: 8,
        fontSize: 12,
        fontWeight: '600',
        color: '#9ca3af',
        width: 40, // Wider than ITEM_WIDTH to prevent truncation
        textAlign: 'center',
    },
    pointerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    pointer: {
        width: 4,
        backgroundColor: '#ef4444',
        borderRadius: 2,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
});
