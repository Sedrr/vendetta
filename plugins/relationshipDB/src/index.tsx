import { commands } from "@vendetta";
import { find, findByName,findByProps, findByStoreName } from "@vendetta/metro";
import { FluxDispatcher, ReactNative, React } from "@vendetta/metro/common";
import { after, before } from "@vendetta/patcher";
import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";
import { General } from "@vendetta/ui/components";
const { TextStyleSheet, Text } = findByProps('TextStyleSheet');
const { View } = General;
const Avatars = findByProps("BOT_AVATARS");
const { createBotMessage } = findByProps("createBotMessage");
const { receiveMessage } = findByProps("receiveMessage");
const OAuth2AuthorizeModal = findByName("OAuth2AuthorizeModal");
const UserProfile = findByProps("PRIMARY_INFO_TOP_OFFSET", "SECONDARY_INFO_TOP_MARGIN", "SIDE_PADDING");
const RowManager = findByName("RowManager");
const Locale = findByProps("Messages");
const MessageActions = findByProps("sendMessage", "receiveMessage");
const UserStore = findByStoreName("UserStore");
const SelectedChannelStore = findByStoreName("SelectedChannelStore");
const { pushModal, popModal } = findByProps("pushModal", "popModal");
const Dialog = findByProps("show", "confirm", "close");
const WL_HOSTNAME = "https://wedlock.exhq.dev";
const pattern = /https:\/\/wedlock\.exhq\.dev\/v2\/propose\/embed\?proposalid=([^\n&]+)/;

let hasDisplayedBrokenServer = false;
async function fetchWedlock(method: "GET" | "POST", url: string, params?: Record<string, string>, hasRetried?: boolean) {
    let responseaaaa: Response;
        responseaaaa = await fetch(WL_HOSTNAME + "/" + url + (params ? "?" + new URLSearchParams(params) : ""), {
            method: method,
            headers: method === "POST" ? {
                authorization: await openOauth2Modal()
            } : {}
        });
        
        if (responseaaaa.status === 200){
            return await responseaaaa.json()
        } else(
            sendSystemMessage(responseaaaa.status.toString())
        )
}

async function openOauth2Modal() {
    if (storage.token) {
        return storage.token;
    }
    return new Promise(resolve => {
    pushModal({
      key: "oauth2-authorize",
      modal: {
        key: "oauth2-authorize",
        modal: OAuth2AuthorizeModal,
        animation: "slide-up",
  
        shouldPersistUnderModals: false,
        props: {
          clientId: "1166756085554757733",
  
          scopes: ["identify"],
          responseType: "token",
          permissions: 0n,
          cancelCompletesFlow: false,
          callback: async ({ location }) => {
                const query = location.split("#")[1];
                const params = new URLSearchParams(query);
                const newToken = params.get("access_token")!!;
                storage.token = (newToken)
                resolve(newToken)
          },
          dismissOAuthModal: () => popModal("oauth2-authorize"),
        },
        closable: true,
      },
    });
});
  }



function sendSystemMessage(message: string) {
    const channel = SelectedChannelStore.getChannelId();
    const author = UserStore.getUser("1155605314557718620")
    receiveMessage(
        channel,
        Object.assign(
            createBotMessage({
                channelId: channel,
                content: message,
            }),
            {
                author,
            }
        )
    );
}

let patches = [];

export default {
    onLoad: () => {
        patches.push(commands.registerCommand({
            name: "propose",
            displayName: "propose",
            description: "start the edating!",
            displayDescription: "start the edating!",
            options: [{
                name: "proposee",
                displayName: "proposee",
                description: Locale.Messages.COMMAND_SHRUG_MESSAGE_DESCRIPTION,
                displayDescription: Locale.Messages.COMMAND_SHRUG_MESSAGE_DESCRIPTION,
                required: true,
                // @ts-ignore
                type: 6
            },
            {
                name: "message",
                displayName: "message",
                description: Locale.Messages.COMMAND_SHRUG_MESSAGE_DESCRIPTION,
                displayDescription: Locale.Messages.COMMAND_SHRUG_MESSAGE_DESCRIPTION,
                required: true,
                // @ts-ignore
                type: 3
            }],
            // @ts-ignore
            applicationId: -1,
            inputType: 1,
            type: 1,

            execute: async (args, ctx) => {
                if (args[0].value === UserStore.getCurrentUser().id) {
                    await sendSystemMessage("you cant marry yourself silly");
                    return;
                }
                await fetchWedlock("POST", "v2/propose", {
                    to: args[0].value,
                    msg: args[1].value
                }).then(r => {
                    MessageActions.sendMessage(ctx.channel.id, {
                        content: (`will you marry me <@${args[0].value}>? ${WL_HOSTNAME}/v2/propose/embed?proposalid=` + r.id)
                    })
                    
                })
            }
        }));

        function UserProfileFetch(id){
            console.log(id.id)
            console.log(`https://wedlock.exhq.dev/v2/marriage?userid=${id.id}`)
            const [data, setData] = React.useState(null);
            React.useEffect(() => {
                fetch(`https://wedlock.exhq.dev/v2/marriage?userid=${id.id}`).then((response) => response.json())
                  .then((data) => {
                    if (data.reason == "Not Found") {
                        setData(<></>)
                        return <></>
                    }

                    fetch(`https://adu.shiggy.fun/v1/${data.bottom ? data.bottom : data.top}.json`).then(r => r.json()).then(data => {
                        setData("married to "+data.username)
                    })
                  })
                  .catch((error) => {
                    console.error('Error fetching data:', error);
                  });
              }, []);

            return <View style={{ marginTop: 10 }}>
            <Text style={[TextStyleSheet['text-xs/medium']]}>
            {data}
            </Text>
        </View> 
        }


        patches.push(after("default", find(x=>x?.default?.name==="UserProfileName"), ([props], res) => {
            let container = res?.props?.children?.props?.children;
            if (!container) return;
            console.log(props.user.id)
            container.push(<UserProfileFetch id={props.user.id}></UserProfileFetch> )
        }))


        patches.push(commands.registerCommand({
            name: "divorce",
            displayName: "divorce",
            description: "stop the edating!",
            displayDescription: "stop the edating!",
            // @ts-ignore
            applicationId: -1,
            inputType: 1,
            type: 1,

            execute(args, ctx) {
                (async () => {
                    await fetchWedlock("POST", "v2/divorce");
                })();
            }
        }));
        
        
        const func = async (e) => {
            if (e?.data?.customId === "customid:3_i_think_this_can_be_anything") {
                const message = findByStoreName("MessageStore").getMessage(findByStoreName("SelectedChannelStore").getChannelId(), e?.messageId).content;
                const words = message.split(' ');
                const proposalidWord = words.find(word => word.startsWith("https://wedlock.exhq.dev/v2/propose/embed?proposalid="));
                if (proposalidWord) {
                    const proposalid = proposalidWord.replace("https://wedlock.exhq.dev/v2/propose/embed?proposalid=", "");
                    
                    await fetchWedlock("GET", "v2/propose/view", { proposalid }).then(r => {
                        if (r.to !== UserStore.getCurrentUser().id) return;
                        Dialog.show({
                            title: UserStore.getUser(r.from).username+"has proposed to you!",
                            body: "cozy",
                            confirmText: "accept",
                            cancelText: "deny",
                            onConfirm: async () => { fetchWedlock("POST", "v2/propose/accept", { proposalid }).then(response =>
                                response && showToast("Accepted proposal succesfully")); },
                            onCancel: async () => { fetchWedlock("POST", "v2/propose/deny", { proposalid }).then(response =>
                                response && showToast("Declined proposal succesfully")); }
                        });
                    })

                    
                }
            }
        };
        
        
        FluxDispatcher.subscribe('INTERACTION_QUEUE', func);

        patches.push(after("generate", RowManager.prototype, ([row], {message}: {message}) => {
            if (!message) return;
            const match = pattern.exec(row.message.content);
            if(!match) return;
            message.components = []
            message.components = [{
                type: 1,
                indices: [0],
                components: [{
                    type: 2,
                    customId: 'customid:3_i_think_this_can_be_anything',
                    style: 1,
                    disabled: undefined,
                    url: undefined,
                    label: "view",
                    emoji: { id: undefined, name: '💙', animated: undefined, src: undefined },
                    indices: [0, 0],
                    applicationId: '0',
                    state: 0
                }],
                errorText: undefined
            }];
        }))
        
    },
    onUnload: () => {
        for (const unpatch of patches) unpatch()
    }
}
