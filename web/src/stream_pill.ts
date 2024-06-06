import type { InputPillItem} from "./input_pill";
import * as peer_data from "./peer_data";
import * as stream_data from "./stream_data";
import type {StreamSubscription} from "./sub_store";
import type {CombinedPillContainer, CombinedPillItem, PillOptions} from "./typeahead_helper";

export type StreamPill = {
    type: "stream";
    stream_id: number;
    stream_name: string;
};

// type StreamPillWidget = InputPillContainer<StreamPill>;

export type StreamPillData = StreamSubscription & {type: "stream"};

function display_pill(sub: StreamSubscription): string {
    const sub_count = peer_data.get_subscriber_count(sub.stream_id);
    return "#" + sub.name + ": " + sub_count + " users";
}

export function create_item_from_stream_name(
    stream_name: string,
    current_items: CombinedPillItem[],
): InputPillItem<StreamPill> | undefined {
    stream_name = stream_name.trim();
    if (!stream_name.startsWith("#")) {
        return undefined;
    }
    stream_name = stream_name.slice(1);

    const sub = stream_data.get_sub(stream_name);
    if (!sub) {
        return undefined;
    }

    if (current_items.some((item) => item.type === "stream" && item.stream_id === sub.stream_id)) {
        return undefined;
    }

    return {
        type: "stream",
        display_value: display_pill(sub),
        stream_id: sub.stream_id,
        stream_name: sub.name,
    };
}

export function get_stream_name_from_item(item: InputPillItem<StreamPill>): string {
    return item.stream_name;
}

export function get_user_ids<T extends PillOptions>(pill_widget: CombinedPillContainer<T>): number[] {
    let user_ids = pill_widget
        .items()
        .flatMap((item) =>
            item.type === "stream" ? peer_data.get_subscribers(item.stream_id) : [],
        );
    user_ids = [...new Set(user_ids)];
    user_ids.sort((a, b) => a - b);
    return user_ids;
}

export function append_stream<T extends PillOptions>(
    stream: StreamSubscription,
    pill_widget: CombinedPillContainer<T>,
    append_validated_data: (pill_widget:CombinedPillContainer<T>, pill_data:InputPillItem<StreamPill>)=>void
): void {
    const pill_data={
        type: "stream",
        display_value: display_pill(stream),
        stream_id: stream.stream_id,
        stream_name: stream.name,
    } as const;
    append_validated_data(pill_widget,pill_data);
    pill_widget.clear_text();
}

export function get_stream_ids<T extends PillOptions>(pill_widget: CombinedPillContainer<T>): number[] {
    const items = pill_widget.items();
    return items.flatMap((item) => (item.type === "stream" ? item.stream_id : []));
}

export function filter_taken_streams<T extends PillOptions>(
    items: StreamSubscription[],
    pill_widget: CombinedPillContainer<T>,
): StreamSubscription[] {
    const taken_stream_ids = get_stream_ids(pill_widget);
    items = items.filter((item) => !taken_stream_ids.includes(item.stream_id));
    return items;
}

export function typeahead_source<T extends PillOptions>(pill_widget: CombinedPillContainer<T>): StreamPillData[] {
    const potential_streams = stream_data.get_unsorted_subs();
    return filter_taken_streams(potential_streams, pill_widget).map((stream) => ({
        ...stream,
        type: "stream",
    }));
}
