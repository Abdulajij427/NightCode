import {useParams , useLocation , useNavigate} from 'react-router';
import {useState , useEffect , useMemo} from 'react'
import {SessionShell} from '../components/session-shell'
import  {z} from 'zod'
import type {MockSession , SessionSummary , CreateSessionInput} from '../../../server/src'
import {UserMessage , BotMessage ,ErrorMessage } from '../components/messages';
import {useToast} from '../providers/toast';
import {apiClient} from '../lib/api-client';
import {getErrorMessage} from '../lib/http-errors'


type SessionData = MockSession;

const sessionLocationSchema = z.object({
    session: z.custom<SessionData>((val)=> val != null && typeof val === "object" && "id" in val),
});


function ChatMessage(
    {msg}: {
        msg : SessionData["messages"][number]
    }
){
    if (msg.role === "USER"){
        return <UserMessage message={msg.content}/>
    }
    
    if (msg.role === "ERROR"){
        return <UserMessage message={msg.content}/>
    }
    
   return <BotMessage content={msg.content} model={msg.model}/>;
};



export function Session(){
    
    const {id} = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();

    const prefetched = useMemo(() => {
        const parsed = sessionLocationSchema.safeParse(location.state);
        return parsed.success ? parsed.data.session : null;
    }, [location.state]);

    const [session , setSession ] = useState<SessionData | null>(prefetched)
    const [error , setError] = useState<string | undefined | null>(undefined)

    useEffect(() => {
        if (prefetched) return;

        setSession(null);
        setError(null);

        if (!id) return;
        let ignore = false;

        const fetchSession = async () => {
            try {
                const resolved = await apiClient.sessions.get(id);
                if (ignore) return;
                setSession(resolved);
            } catch (error) {
                if (ignore) return;
                setError(error instanceof Error ? error.message : "Failed to load session");
                navigate("/", {replace: true});
            }
        };

        fetchSession();

        return () => {
            ignore = true;
        };
    }, [id, prefetched , toast , navigate]);

    if(!session){
        return <SessionShell onSubmit={()=> {}} />
    }

    return(
        <SessionShell onSubmit={() => {}}  >
            {session.messages.map((msg)=> (
                <ChatMessage key={msg.id} msg={msg}/>
            ))}
        </SessionShell>
    );
};


