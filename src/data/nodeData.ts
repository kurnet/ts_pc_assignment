export class NodeData{
    NodePercent:number[];
    MaxPercent:number = 0;

    constructor(json:any){
        if(json.hasOwnProperty('node_precent')){
            let _p = json.node_precent as Array<number>;
            this.NodePercent = _p;
            
            this.NodePercent.forEach(_precent =>{
                this.MaxPercent += _precent;
            });
        }
    }
}