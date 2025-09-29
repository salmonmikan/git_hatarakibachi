// // git_hatarakibachi/src/components/MembersGrid.jsx
// import { useState } from 'react';
// import MemberCard from './MemberCard';
// import MemberModal from './MemberModal';

// export default function MembersGrid({ members = [] }) {
//     const [selected, setSelected] = useState(null);

//     return (
//         <>
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                 {members.map((m) => (
//                     <MemberCard
//                         key={m.id || m.name}
//                         {...m}
//                         onOpen={() => setSelected(m)}  // ★ ここでモーダル開く
//                     />
//                 ))}
//             </div>

//             <MemberModal
//                 open={!!selected}
//                 member={selected}
//                 onClose={() => setSelected(null)}
//             />
//         </>
//     );
// }
